'use client';
import SignOutButton from '@/components/SignOutButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { MapIcon, PackageIcon, TruckIcon } from 'lucide-react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MainPageProps {
  session: Session | null;
}

export function MainPage({ session }: MainPageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome to Shipply
        </h1>
        <p className="text-xl text-gray-600">Your trusted logistics partner</p>
        <p className="mt-2">Signed in as {session?.user?.name}</p>
      </motion.div>

      <Card className="w-full max-w-4xl bg-white/80 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/booking" passHref>
                <Button className="w-full h-32 text-lg font-semibold bg-blue-500 hover:bg-blue-600 transition-colors">
                  <div className="flex flex-col items-center">
                    <PackageIcon className="h-8 w-8 mb-2" />
                    Book a Shipment
                  </div>
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/driver" passHref>
                <Button className="w-full h-32 text-lg font-semibold bg-green-500 hover:bg-green-600 transition-colors">
                  <div className="flex flex-col items-center">
                    <TruckIcon className="h-8 w-8 mb-2" />
                    Driver Dashboard
                  </div>
                </Button>
              </Link>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl"
      >
        {mounted &&
          [
            {
              icon: TruckIcon,
              title: 'Real-time Tracking',
              description: 'Track your shipments in real-time',
            },
            {
              icon: PackageIcon,
              title: 'Flexible Booking',
              description: 'Book shipments with ease',
            },
            {
              icon: MapIcon,
              title: 'WorldWide Coverage',
              description: 'Extensive network of drivers',
            },
          ].map((feature, index) => (
            <Card
              key={index}
              className="bg-white/80 backdrop-blur-sm shadow-md"
            >
              <CardContent className="p-4 text-center">
                <feature.icon className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
      </motion.div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
