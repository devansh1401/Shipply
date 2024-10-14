'use client';

import BookingForm from '@/components/BookingForm';
import socket from '@/utils/socket';
import { BookingStatus, VehicleType } from '@prisma/client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface Location {
  lat: number;
  lng: number;
}

interface DriverDetails {
  id: string;
  name: string;
  vehicleType: VehicleType;
  plateNumber: string;
  phone: string;
}

export default function BookingPage() {
  const [pickup, setPickup] = useState<Location>({ lat: 0, lng: 0 });
  const [dropoff, setDropoff] = useState<Location>({ lat: 0, lng: 0 });
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(
    null
  );
  const [bookingStatus, setBookingStatus] = useState<BookingStatus | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    console.log('Component mounted');
    // Check localStorage for existing bookingId
    const storedBookingId = localStorage.getItem('bookingId');
    if (storedBookingId) {
      console.log('Found stored bookingId:', storedBookingId);
      setBookingId(storedBookingId);
      fetchBookingDetails(storedBookingId);
    }

    // Socket event listeners
    socket.on('driverLocationUpdate', (data: Location) => {
      console.log('Received driver location update:', data);
      setDriverLocation(data);
    });

    socket.on('bookingUpdated', (updatedBooking: any) => {
      console.log('Received booking update:', updatedBooking);
      setBookingStatus(updatedBooking.status);
      if (updatedBooking.driver) {
        setDriverDetails(updatedBooking.driver);
      }
    });

    return () => {
      console.log('Component unmounting');
      socket.off('driverLocationUpdate');
      socket.off('bookingUpdated');
    };
  }, []);

  useEffect(() => {
    if (bookingId) {
      console.log('Joining booking room:', bookingId);
      socket.emit('joinBookingRoom', bookingId);
    }

    return () => {
      if (bookingId) {
        console.log('Leaving booking room:', bookingId);
        socket.emit('leaveBookingRoom', bookingId);
      }
    };
  }, [bookingId]);

  const fetchBookingDetails = async (id: string) => {
    try {
      console.log('Fetching booking details for ID:', id);
      const response = await fetch(`/api/bookings/${id}`);
      if (response.ok) {
        const booking = await response.json();
        console.log('Fetched booking details:', booking);
        setBookingStatus(booking.status);
        if (booking.driver) {
          setDriverDetails(booking.driver);
        }
        setPickup({ lat: booking.pickupLat, lng: booking.pickupLng });
        setDropoff({ lat: booking.dropoffLat, lng: booking.dropoffLng });
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  const handleBookingSubmit = async (bookingData: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    vehicleType: VehicleType;
  }) => {
    try {
      console.log('Submitting booking:', bookingData);
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
      localStorage.setItem('bookingId', booking.id);
      setBookingStatus(booking.status);
      setPickup({ lat: booking.pickupLat, lng: booking.pickupLng });
      setDropoff({ lat: booking.dropoffLat, lng: booking.dropoffLng });
      socket.emit('joinBookingRoom', booking.id);
      socket.emit('newBooking', booking.id);
      router.push(`/booking?id=${booking.id}`);
    } catch (error) {
      console.error('Error submitting booking:', error);
      // Handle the error, maybe show it to the user
    }
  };

  const startNewBooking = () => {
    console.log('Starting new booking');
    setBookingId(null);
    setBookingStatus(null);
    setDriverDetails(null);
    setDriverLocation(null);
    localStorage.removeItem('bookingId');
    router.push('/booking');
  };

  const renderBookingStatus = () => {
    switch (bookingStatus) {
      case BookingStatus.PENDING:
        return <p>Waiting for a driver to accept your booking...</p>;
      case BookingStatus.ACCEPTED:
        return <p>A driver has accepted your booking and is on their way!</p>;
      case BookingStatus.EN_ROUTE_TO_PICKUP:
        return <p>Your driver is on the way to pick you up.</p>;
      case BookingStatus.ARRIVED_AT_PICKUP:
        return <p>Your driver has arrived at the pickup location.</p>;
      case BookingStatus.IN_PROGRESS:
        return <p>Your ride is in progress.</p>;
      case BookingStatus.COMPLETED:
        return (
          <div>
            <p>
              Your ride has been completed. Thank you for using our service!
            </p>
            <button
              onClick={startNewBooking}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Start New Booking
            </button>
          </div>
        );
      case BookingStatus.CANCELLED:
        return (
          <div>
            <p>This booking has been cancelled.</p>
            <button
              onClick={startNewBooking}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Start New Booking
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="w-full md:w-1/2 p-4">
        <h1 className="text-2xl font-bold mb-4">Book Your Ride</h1>
        {!bookingId ? (
          <BookingForm
            pickup={pickup}
            dropoff={dropoff}
            setPickup={setPickup}
            setDropoff={setDropoff}
            onSubmit={handleBookingSubmit}
          />
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Booking Status: {bookingStatus}
            </h2>
            {renderBookingStatus()}
            {driverDetails && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Driver Details:</h3>
                <p>Name: {driverDetails.name}</p>
                <p>Phone: {driverDetails.phone}</p>
                <p>Vehicle Type: {driverDetails.vehicleType}</p>
                <p>Plate Number: {driverDetails.plateNumber}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="w-full md:w-1/2">
        <Map
          pickup={pickup}
          dropoff={dropoff}
          setPickup={setPickup}
          setDropoff={setDropoff}
          driverLocation={driverLocation}
          driverDetails={driverDetails}
        />
      </div>
    </div>
  );
}
