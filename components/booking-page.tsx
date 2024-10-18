'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculateDistance, calculatePrice } from '@/utils/pricingUtils';
import socket from '@/utils/socket';
import { BookingStatus, VehicleType } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, Truck, User } from 'lucide-react';
import { Session } from 'next-auth';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BookingPageComponentProps {
  session: Session | null;
}

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

export default function BookingPageComponent({
  session,
}: BookingPageComponentProps) {
  const [pickup, setPickup] = useState<Location>({ lat: 0, lng: 0 });
  const [dropoff, setDropoff] = useState<Location>({ lat: 0, lng: 0 });
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(
    null
  );
  const [bookingStatus, setBookingStatus] = useState<BookingStatus | null>(
    null
  );
  const router = useRouter();
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  useEffect(() => {
    console.log('Component mounted');
    const storedBookingId = localStorage.getItem('bookingId');
    if (storedBookingId) {
      console.log('Found stored bookingId:', storedBookingId);
      setBookingId(storedBookingId);
      fetchBookingDetails(storedBookingId);
    }

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

  useEffect(() => {
    if (
      pickup.lat !== 0 &&
      pickup.lng !== 0 &&
      dropoff.lat !== 0 &&
      dropoff.lng !== 0
    ) {
      const distance = calculateDistance(
        pickup.lat,
        pickup.lng,
        dropoff.lat,
        dropoff.lng
      );
      const price = calculatePrice(distance, vehicleType);
      setEstimatedPrice(price);
    } else {
      setEstimatedPrice(null);
    }
  }, [pickup, dropoff, vehicleType]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
          vehicleType,
        }),
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
      socket.emit('joinBookingRoom', booking.id);
      socket.emit('newBooking', booking.id);
      router.push(`/booking?id=${booking.id}`);
    } catch (error) {
      console.error('Error submitting booking:', error);
      // Handle the error, maybe show it to the user
    }
  };

  const resetBooking = () => {
    console.log('Starting new booking');
    setBookingId(null);
    setBookingStatus(null);
    setDriverDetails(null);
    setDriverLocation(null);
    setPickup({ lat: 0, lng: 0 });
    setDropoff({ lat: 0, lng: 0 });
    setVehicleType(VehicleType.CAR);
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
            <Button
              onClick={resetBooking}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Start New Booking
            </Button>
          </div>
        );
      case BookingStatus.CANCELLED:
        return (
          <div>
            <p>This booking has been cancelled.</p>
            <Button
              onClick={resetBooking}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Start New Booking
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            {bookingId ? 'Booking Status' : 'Book Your Ride'}
          </h1>

          <AnimatePresence mode="wait">
            {!bookingId && (
              <motion.form
                key="booking-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="pickup">Pickup Location</Label>
                  <Input
                    id="pickup"
                    placeholder="Enter pickup coordinates (lat, lng)"
                    value={`${pickup.lat}, ${pickup.lng}`}
                    onChange={(e) => {
                      const [lat, lng] = e.target.value.split(',').map(Number);
                      setPickup({ lat, lng });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dropoff">Dropoff Location</Label>
                  <Input
                    id="dropoff"
                    placeholder="Enter dropoff coordinates (lat, lng)"
                    value={`${dropoff.lat}, ${dropoff.lng}`}
                    onChange={(e) => {
                      const [lat, lng] = e.target.value.split(',').map(Number);
                      setDropoff({ lat, lng });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle-type">Vehicle Type</Label>
                  <Select
                    onValueChange={(value) =>
                      setVehicleType(value as VehicleType)
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(VehicleType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {estimatedPrice !== null && (
                  <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Estimated Price: </strong>
                    <span className="block sm:inline">
                      ${estimatedPrice.toFixed(2)}
                    </span>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Submit Booking
                </Button>
              </motion.form>
            )}

            {bookingId && (
              <motion.div
                key="booking-status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Booking ID: {bookingId}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold mb-2">
                      Status:{' '}
                      {bookingStatus === BookingStatus.PENDING
                        ? 'Waiting for a driver'
                        : bookingStatus}
                    </p>
                    {renderBookingStatus()}
                    {driverDetails && (
                      <div className="space-y-2 mt-4">
                        <p>
                          <User className="inline mr-2" />
                          {driverDetails.name}
                        </p>
                        <p>
                          <Truck className="inline mr-2" />
                          {driverDetails.vehicleType} -{' '}
                          {driverDetails.plateNumber}
                        </p>
                        <p>
                          <Phone className="inline mr-2" />
                          {driverDetails.phone}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {bookingStatus !== BookingStatus.COMPLETED &&
                  bookingStatus !== BookingStatus.CANCELLED && (
                    <Button
                      onClick={resetBooking}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Start New Booking
                    </Button>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="w-full md:w-1/2 p-6">
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
