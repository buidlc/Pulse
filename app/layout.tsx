import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { themeBootstrapScript } from '@frontend/hooks/useTheme';

export const metadata: Metadata = {
  title: 'PULSE — sell what you know, earn forever',
  description:
    'Decentralized creator monetization protocol. Articles, videos and courses on Shelbynet, powered by Shelby. No bans. No takedowns. Earnings to your wallet.',
  metadataBase: new URL('https://pulse-3tt.pages.dev'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
