import { VehicleType } from '@prisma/client';
import React, { useState } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface BookingFormProps {
  pickup: Location;
  dropoff: Location;
  setPickup: (location: Location) => void;
  setDropoff: (location: Location) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  pickup,
  dropoff,
  setPickup,
  setDropoff,
}) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setBookingConfirmation(null);

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
      setBookingConfirmation(booking);
      console.log('Booking created:', booking);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="pickup"
          className="block text-sm font-medium text-gray-700"
        >
          Pickup Location
        </label>
        <input
          type="text"
          id="pickup"
          value={`${pickup.lat.toFixed(6)}, ${pickup.lng.toFixed(6)}`}
          onChange={(e) => {
            const [lat, lng] = e.target.value.split(',').map(Number);
            setPickup({ lat, lng });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          required
        />
      </div>
      <div>
        <label
          htmlFor="dropoff"
          className="block text-sm font-medium text-gray-700"
        >
          Dropoff Location
        </label>
        <input
          type="text"
          id="dropoff"
          value={`${dropoff.lat.toFixed(6)}, ${dropoff.lng.toFixed(6)}`}
          onChange={(e) => {
            const [lat, lng] = e.target.value.split(',').map(Number);
            setDropoff({ lat, lng });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          required
        />
      </div>
      <div>
        <label
          htmlFor="vehicleType"
          className="block text-sm font-medium text-gray-700"
        >
          Vehicle Type
        </label>
        <select
          id="vehicleType"
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value as VehicleType)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          {Object.values(VehicleType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="text-red-500">{error}</div>}

      {bookingConfirmation && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Booking Confirmed!</strong>
          <p className="block sm:inline">
            Your estimated price is $
            {bookingConfirmation.priceEstimate.toFixed(2)}
          </p>
          <p className="block sm:inline">
            Distance: {bookingConfirmation.distance.toFixed(2)} km
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {isSubmitting ? 'Booking...' : 'Book Now'}
      </button>
    </form>
  );
};

export default BookingForm;
