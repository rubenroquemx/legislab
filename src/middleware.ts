import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'usrubenroque@gmail.com').toLowerCase().trim();

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const isSuper = token?.isSuperAdmin === true || token?.email?.toLowerCase() === SUPERADMIN_EMAIL;

    // 1. Protección exclusiva para el panel Superadmin (/admin)
    if (path.startsWith('/admin')) {
      if (!isSuper) {
        return NextResponse.redirect(new URL('/dashboard?error=admin_required', req.url));
      }
      return NextResponse.next();
    }

    // 2. Protección para el panel del Despacho (/dashboard, /agenda, /gestiones, etc.)
    // Si no es superadmin y no tiene un despacho asignado, redirigir a /planes
    if (!isSuper && !token?.officeId) {
      return NextResponse.redirect(new URL('/planes?unassigned=true', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Si no hay token en rutas protegidas, redirigir al login
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/agenda/:path*',
    '/gestiones/:path*',
    '/tareas/:path*',
    '/territorio/:path*',
    '/directorio/:path*',
    '/redactor/:path*',
    '/iniciativas/:path*',
    '/discursos/:path*',
    '/boletines/:path*',
    '/medios/:path*',
    '/marco-juridico/:path*',
    '/atencion-ciudadana/:path*',
    '/grupos/:path*',
    '/usuarios/:path*',
    '/configuracion/:path*',
  ],
};
