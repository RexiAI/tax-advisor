import type { Metadata, Viewport } from 'next';

import '@fontsource-variable/ibm-plex-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

import { APP_NAME, AI_DISCLOSURE } from '@/content/strings';

import '@/styles/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: APP_NAME,
  description: AI_DISCLOSURE,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-ES">
      <body>{children}</body>
    </html>
  );
}
