import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
      officeId?: string | null;
      isSuperAdmin?: boolean;
      cargo?: string | null;
      permissions?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role?: string;
    officeId?: string | null;
    isSuperAdmin?: boolean;
    cargo?: string | null;
    permissions?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    officeId?: string | null;
    isSuperAdmin?: boolean;
    cargo?: string | null;
    permissions?: string | null;
  }
}
