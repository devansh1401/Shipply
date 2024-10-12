'use client';

import BookingForm from '@/components/BookingForm';
import socket from '@/utils/socket';
import { VehicleType } from '@prisma/client';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface Location {
  lat: number;
  lng: number;
}

export default function BookingPage() {
  const [pickup, setPickup] = useState<Location>({ lat: 0, lng: 0 });
  const [dropoff, setDropoff] = useState<Location>({ lat: 0, lng: 0 });
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setBookingId(id);
      socket.emit('joinBookingRoom', id);

      socket.on('driverLocationUpdate', (data: Location) => {
        setDriverLocation(data);
      });
    }

    return () => {
      if (id) {
        socket.emit('leaveBookingRoom', id);
        socket.off('driverLocationUpdate');
      }
    };
  }, [searchParams]);

  const handleBookingSubmit = async (bookingData: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    vehicleType: VehicleType;
  }) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const booking = await response.json();
      console.log('Booking created:', booking);
      setBookingId(booking.id);
      socket.emit('newBooking', booking.id);
      // You might want to update the UI or redirect the user here
    } catch (error) {
      console.error('Error submitting booking:', error);
      // Handle the error, maybe show it to the user
      // For example, you could set an error state and display it in the UI
      // setErrorMessage(error.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="w-full md:w-1/2 p-4">
        <h1 className="text-2xl font-bold mb-4">Book Your Ride</h1>
        <BookingForm
          pickup={pickup}
          dropoff={dropoff}
          setPickup={setPickup}
          setDropoff={setDropoff}
          onSubmit={handleBookingSubmit}
        />
      </div>
      <div className="w-full md:w-1/2">
        <Map
          pickup={pickup}
          dropoff={dropoff}
          setPickup={setPickup}
          setDropoff={setDropoff}
          driverLocation={driverLocation}
        />
      </div>
    </div>
  );
}
