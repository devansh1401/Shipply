'use client';

import socket from '@/utils/socket';
import {
  Booking,
  BookingStatus,
  Driver,
  DriverStatus,
  VehicleType,
} from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function DriverPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    phone: '',
    vehicleType: 'CAR' as VehicleType,
    plateNumber: '',
  });

  const fetchDriverDetails = useCallback(async () => {
    try {
      const response = await fetch('/api/drivers');
      if (response.ok) {
        const driverData = await response.json();
        setDriver(driverData);
        if (driverData.status === DriverStatus.BUSY) {
          fetchCurrentBooking();
        } else {
          fetchPendingBookings();
        }
      } else if (response.status === 404) {
        setDriver(null);
        setIsRegistering(true);
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  }, []); // Empty dependency array as it doesn't use any external values

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchDriverDetails();
    }
  }, [status, router, fetchDriverDetails]);

  const fetchCurrentBooking = async () => {
    try {
      const response = await fetch('/api/bookings/current');
      if (response.ok) {
        const booking = await response.json();
        setCurrentBooking(booking);
      }
    } catch (error) {
      console.error('Error fetching current booking:', error);
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const response = await fetch('/api/bookings?status=PENDING');
      if (response.ok) {
        const bookings = await response.json();
        setAvailableBookings(bookings);
      }
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
    }
  };

  useEffect(() => {
    if (driver) {
      socket.emit('driverConnect', driver.id);

      socket.on('newBooking', (booking: Booking) => {
        if (driver.status === DriverStatus.AVAILABLE) {
          setAvailableBookings((prev) => [...prev, booking]);
        }
      });

      socket.on('driverStatusUpdated', ({ driverId, status }) => {
        if (driverId === driver.id) {
          setDriver((prev) => ({ ...prev!, status }));
          if (status === DriverStatus.AVAILABLE) {
            setCurrentBooking(null);
            fetchPendingBookings();
          }
        }
      });

      socket.on('bookingUpdated', (updatedBooking: Booking) => {
        if (updatedBooking.driverId === driver.id) {
          setCurrentBooking(updatedBooking);
        }
      });

      return () => {
        socket.off('newBooking');
        socket.off('driverStatusUpdated');
        socket.off('bookingUpdated');
      };
    }
  }, [driver]);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      if (response.ok) {
        console.log('Driver registered successfully');
        setIsRegistering(false);
        fetchDriverDetails();
      } else {
        const error = await response.json();
        console.error('Registration failed:', error);
      }
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
      });
      if (response.ok) {
        const acceptedBooking = await response.json();
        setCurrentBooking(acceptedBooking);
        setAvailableBookings([]);
        setDriver((prev) => ({ ...prev!, status: DriverStatus.BUSY }));
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
    }
  };

  const handleRejectBooking = (bookingId: string) => {
    setAvailableBookings((prev) =>
      prev.filter((booking) => booking.id !== bookingId)
    );
  };

  const handleCompleteBooking = async () => {
    if (currentBooking) {
      try {
        const response = await fetch(
          `/api/bookings/${currentBooking.id}/complete`,
          {
            method: 'POST',
          }
        );
        if (response.ok) {
          setCurrentBooking(null);
          setDriver((prev) => ({ ...prev!, status: DriverStatus.AVAILABLE }));
          fetchPendingBookings();
        }
      } catch (error) {
        console.error('Error completing booking:', error);
      }
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (isRegistering) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Register as a Driver</h1>
        <form onSubmit={handleRegistration} className="space-y-4">
          <input
            type="text"
            value={registrationData.name}
            onChange={(e) =>
              setRegistrationData({ ...registrationData, name: e.target.value })
            }
            placeholder="Name"
            required
            className="w-full p-2 border rounded"
          />
          <input
            type="tel"
            value={registrationData.phone}
            onChange={(e) =>
              setRegistrationData({
                ...registrationData,
                phone: e.target.value,
              })
            }
            placeholder="Phone"
            required
            className="w-full p-2 border rounded"
          />
          <select
            value={registrationData.vehicleType}
            onChange={(e) =>
              setRegistrationData({
                ...registrationData,
                vehicleType: e.target.value as VehicleType,
              })
            }
            required
            className="w-full p-2 border rounded"
          >
            {Object.values(VehicleType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={registrationData.plateNumber}
            onChange={(e) =>
              setRegistrationData({
                ...registrationData,
                plateNumber: e.target.value,
              })
            }
            placeholder="Plate Number"
            required
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Register
          </button>
        </form>
      </div>
    );
  }

  if (!driver) {
    return <div>Loading driver information...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Driver Dashboard</h1>
      <p className="mb-4">Status: {driver.status}</p>
      {currentBooking ? (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-semibold mb-2">Current Booking</h2>
          <p>
            Pickup: {currentBooking.pickupLat}, {currentBooking.pickupLng}
          </p>
          <p>
            Dropoff: {currentBooking.dropoffLat}, {currentBooking.dropoffLng}
          </p>
          <p>Status: {currentBooking.status}</p>
          {currentBooking.status === BookingStatus.IN_PROGRESS && (
            <button
              onClick={handleCompleteBooking}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
            >
              Complete Booking
            </button>
          )}
        </div>
      ) : driver.status === DriverStatus.AVAILABLE ? (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-semibold mb-2">Available Bookings</h2>
          {availableBookings.length === 0 ? (
            <p>No available bookings at the moment.</p>
          ) : (
            <ul>
              {availableBookings.map((booking) => (
                <li key={booking.id} className="mb-4 p-4 border rounded">
                  <p>
                    Pickup: {booking.pickupLat}, {booking.pickupLng}
                  </p>
                  <p>
                    Dropoff: {booking.dropoffLat}, {booking.dropoffLng}
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={() => handleAcceptBooking(booking.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectBooking(booking.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p>You are currently unavailable for new bookings.</p>
      )}
    </div>
  );
}
