'use client';

import BookingForm from '@/components/BookingForm';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function BookingPage() {
  const [pickup, setPickup] = useState({ lat: 0, lng: 0 });
  const [dropoff, setDropoff] = useState({ lat: 0, lng: 0 });

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="w-full md:w-1/2 p-4">
        <h1 className="text-2xl font-bold mb-4">Book Your Ride</h1>
        <BookingForm
          pickup={pickup}
          dropoff={dropoff}
          setPickup={setPickup}
          setDropoff={setDropoff}
        />
      </div>
      <div className="w-full md:w-1/2">
        <Map
          pickup={pickup}
          dropoff={dropoff}
          setPickup={setPickup}
          setDropoff={setDropoff}
        />
      </div>
    </div>
  );
}
