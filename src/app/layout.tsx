import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';

export const metadata: Metadata = {
  title: 'LegisLab | Plataforma de Gestión Parlamentaria & Redacción con IA',
  description: 'El SaaS moderno para diputados, bancadas y equipos legislativos.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LegisLab',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  }
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LegisLab" />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          {children}
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('LegisLab ServiceWorker registrado con éxito:', registration.scope);
                    },
                    function(err) {
                      console.log('Fallo al registrar ServiceWorker:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
