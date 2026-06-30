
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Script from 'next/script';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className}`} suppressHydrationWarning>
          <Providers>{children}</Providers>
      </body>
    </html>
  );
}

