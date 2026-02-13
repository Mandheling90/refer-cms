import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ApolloProvider } from '@/components/providers/ApolloProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'EHR CMS 관리자',
  description: 'EHR CMS 관리자 시스템',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="font-sans antialiased">
        <ApolloProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
