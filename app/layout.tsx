// app/layout.tsx
import { auth } from '@/auth';
import SignInButton from '@/components/SignInButton';
import SignOutButton from '@/components/SignOutButton';
import 'leaflet/dist/leaflet.css'; // Add this line
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

  console.log('RootLayout rendered');

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
          crossOrigin=""
        />
      </head>
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
