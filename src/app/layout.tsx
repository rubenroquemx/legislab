import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Legislab | Plataforma de Gestión Parlamentaria & Redacción con IA',
  description: 'El SaaS moderno para diputados, bancadas y equipos legislativos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}