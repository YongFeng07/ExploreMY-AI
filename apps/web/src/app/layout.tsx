import type { Metadata, Viewport } from 'next';
import { RootProvider } from '@/providers/root-provider';
import '@/styles/globals.css';

export const viewport: Viewport = {
  themeColor: { color: '#F5EFE6' },
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export const metadata: Metadata = {
  title: { default: 'ExploreMY AI', template: '%s | ExploreMY' },
  description: 'AI-powered travel discovery platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-[#F5EFE6] text-[#0E0E0E] font-sans antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
