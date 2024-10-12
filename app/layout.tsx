// app/layout.tsx
import { auth } from '@/auth';
import SignInButton from '@/components/SignInButton';
import SignOutButton from '@/components/SignOutButton';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'On-Demand Logistics Platform',
  description: 'Book transportation services for your goods with ease',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <nav className="bg-gray-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">Logistics Platform</h1>
              <div>
                {session ? (
                  <>
                    <span className="mr-4">Hello, {session.user?.name}</span>
                    <SignOutButton />
                  </>
                ) : (
                  <SignInButton />
                )}
              </div>
            </div>
          </nav>
          <main className="container mx-auto mt-8">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
