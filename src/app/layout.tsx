import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';

export const metadata: Metadata = {
  title: 'LegisLab | Plataforma de Gestión Parlamentaria & Redacción con IA',
  description: 'El SaaS moderno para diputados, bancadas y equipos legislativos.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LegisLab',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  }
};

export const viewport: Viewport = {
  themeColor: '#0B172D',
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-180x180.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LegisLab" />
        <meta name="application-name" content="LegisLab" />
        <meta name="theme-color" content="#0B172D" />
      </head>
      <body className="h-full bg-[#F3F5F9] text-[#0B172D] antialiased selection:bg-[#1B62E3]/20 selection:text-[#0B172D]">
        <AuthProvider>
          {children}
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  // Purge old cache storage entries on client side
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      keys.forEach(function(key) {
                        if (!key.startsWith('legislab-pwa-v7-')) {
                          console.log('[App] Purgando caché obsoleta:', key);
                          caches.delete(key);
                        }
                      });
                    });
                  }

                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      registration.update();
                      
                      registration.onupdatefound = function() {
                        var installingWorker = registration.installing;
                        if (installingWorker) {
                          installingWorker.onstatechange = function() {
                            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('[App] Nueva versión detectada, actualizando interfaz...');
                              window.location.reload();
                            }
                          };
                        }
                      };
                    },
                    function(err) {
                      console.log('Error al registrar ServiceWorker:', err);
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
