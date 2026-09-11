import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users, offices } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { SUPERADMIN_EMAIL } from '@/lib/auth-constants';
export { SUPERADMIN_EMAIL };
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'AdminLegislab2026!';

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'credentials',
      name: 'Correo y Contraseña',
      credentials: {
        email: { label: 'Correo Electrónico', type: 'email', placeholder: 'usuario@congreso.gob.mx' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const cleanEmail = credentials.email.toLowerCase().trim();
        const inputPassword = credentials.password;

        // 1. Acceso de Superadmin Maestro configurado por ENV
        if (cleanEmail === SUPERADMIN_EMAIL) {
          if (inputPassword === SUPERADMIN_PASSWORD) {
            try {
              const [dbAdmin] = await db
                .select()
                .from(users)
                .where(eq(users.email, SUPERADMIN_EMAIL))
                .limit(1);

              if (dbAdmin) {
                await db
                  .update(users)
                  .set({ lastLoginAt: new Date(), isSuperAdmin: true })
                  .where(eq(users.id, dbAdmin.id));

                return {
                  id: dbAdmin.id,
                  name: dbAdmin.name || 'Ruben Roque (Superadmin)',
                  email: SUPERADMIN_EMAIL,
                  role: 'admin',
                  isSuperAdmin: true,
                  officeId: dbAdmin.officeId || null,
                  cargo: dbAdmin.cargo || 'Super Administrador SaaS',
                  permissions: dbAdmin.permissions || null,
                };
              }
            } catch (e) {
              console.warn('Superadmin DB query error, using env fallback:', e);
            }

            return {
              id: 'usr-superadmin-master',
              name: 'Ruben Roque (Superadmin)',
              email: SUPERADMIN_EMAIL,
              role: 'admin',
              isSuperAdmin: true,
              officeId: null,
              cargo: 'Super Administrador SaaS',
              permissions: null,
            };
          }
        }

        // 2. Consulta de usuario en Base de Datos
        try {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, cleanEmail))
            .limit(1);

          if (!dbUser) {
            // Usuario no encontrado
            return null;
          }

          if (dbUser.status === 'suspended') {
            throw new Error('Tu cuenta está suspendida. Contacta a tu administrador.');
          }

          if (dbUser.status === 'invited') {
            throw new Error('Debes activar tu cuenta primero desde el enlace de invitación.');
          }

          let passwordMatch = false;

          if (dbUser.passwordHash) {
            passwordMatch = await bcrypt.compare(inputPassword, dbUser.passwordHash);
          } else if (inputPassword === 'legislab2026' || inputPassword === 'admin123') {
            // Fallback de inicialización para cuentas previas
            passwordMatch = true;
          }

          if (!passwordMatch) {
            return null;
          }

          // Registrar última fecha de acceso
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, dbUser.id));

          const isSuper = Boolean(dbUser.isSuperAdmin) || cleanEmail === SUPERADMIN_EMAIL;

          return {
            id: dbUser.id,
            name: dbUser.name || 'Usuario',
            email: dbUser.email,
            role: dbUser.role || 'asesor_a',
            officeId: dbUser.officeId || null,
            cargo: dbUser.cargo || 'Integrante de Despacho',
            isSuperAdmin: isSuper,
            permissions: dbUser.permissions || null,
          };
        } catch (dbErr: any) {
          if (dbErr?.message && (dbErr.message.includes('suspendida') || dbErr.message.includes('activar'))) {
            throw dbErr;
          }
          console.error('Error in authorize credentials:', dbErr);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        const cleanEmail = user.email.toLowerCase().trim();
        try {
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, cleanEmail))
            .limit(1);

          if (existingUser) {
            if (existingUser.status === 'suspended') {
              return false; // Bloquear inicio de sesión
            }
            // Si estaba en estado "invited", al iniciar sesión con Google se activa automáticamente
            if (existingUser.status === 'invited') {
              await db
                .update(users)
                .set({ status: 'active', lastLoginAt: new Date(), image: user.image || existingUser.image })
                .where(eq(users.id, existingUser.id));
            } else {
              await db
                .update(users)
                .set({ lastLoginAt: new Date(), image: user.image || existingUser.image })
                .where(eq(users.id, existingUser.id));
            }
          }
        } catch (err) {
          console.warn('Error in Google signIn callback:', err);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'asesor_a';
        token.officeId = user.officeId || null;
        token.isSuperAdmin = user.isSuperAdmin || user.email?.toLowerCase() === SUPERADMIN_EMAIL;
        token.cargo = user.cargo || 'Integrante';
        token.permissions = user.permissions || null;
      }

      // Si inició sesión con Google o necesitamos refrescar datos de base de datos
      if (token.email) {
        const cleanEmail = token.email.toLowerCase().trim();
        if (cleanEmail === SUPERADMIN_EMAIL) {
          token.isSuperAdmin = true;
          token.role = 'admin';
        }

        try {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, cleanEmail))
            .limit(1);

          if (dbUser) {
            token.id = dbUser.id;
            token.officeId = dbUser.officeId || null;
            token.role = dbUser.role || 'asesor_a';
            token.cargo = dbUser.cargo || 'Integrante';
            token.isSuperAdmin = Boolean(dbUser.isSuperAdmin) || cleanEmail === SUPERADMIN_EMAIL;
            token.permissions = dbUser.permissions || null;
          }
        } catch (e) {
          // Ignorar si la BD aún no está disponible
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.officeId = token.officeId as string | null;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.cargo = token.cargo as string;
        session.user.permissions = token.permissions as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'legislab-secret-key-2026',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };