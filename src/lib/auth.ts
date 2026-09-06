import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

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
    // Proveedor institucional / demo para desarrollo local
    CredentialsProvider({
      id: 'credentials',
      name: 'Acceso Institucional',
      credentials: {
        email: { label: 'Correo', type: 'email', placeholder: 'diputado@congreso.gob.mx' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        // Usuario demo predeterminado
        if (credentials?.email) {
          return {
            id: 'usr-demo-01',
            name: 'Dip. Ruben Roque',
            email: credentials.email,
            image: null,
            role: 'diputado',
            officeId: 'off-demo-01',
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'diputado';
        token.officeId = (user as { officeId?: string }).officeId || 'off-demo-01';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { officeId?: string }).officeId = token.officeId as string;
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