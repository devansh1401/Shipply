import { Button } from '@/components/ui/button';
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
import { VehicleType } from '@prisma/client';
import React, { useEffect, useState } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface BookingFormProps {
  pickup: Location;
  dropoff: Location;
  setPickup: (location: Location) => void;
  setDropoff: (location: Location) => void;
  onSubmit: (bookingData: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    vehicleType: VehicleType;
  }) => Promise<void>;
}

const BookingForm: React.FC<BookingFormProps> = ({
  pickup,
  dropoff,
  setPickup,
  setDropoff,
  onSubmit,
}) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  useEffect(() => {
    if (pickup.lat && pickup.lng && dropoff.lat && dropoff.lng) {
      const distance = calculateDistance(
        pickup.lat,
        pickup.lng,
        dropoff.lat,
        dropoff.lng
      );
      const price = calculatePrice(distance, vehicleType);
      setEstimatedPrice(price);
    }
  }, [pickup, dropoff, vehicleType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setBookingConfirmation(null);

    try {
      await onSubmit({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        vehicleType,
      });
      setBookingConfirmation({ message: 'Booking submitted successfully' });
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
      <div className="space-y-2">
        <Label htmlFor="pickup">Pickup Location</Label>
        <Input
          id="pickup"
          placeholder="Enter pickup coordinates (lat, lng)"
          value={`${pickup.lat.toFixed(6)}, ${pickup.lng.toFixed(6)}`}
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
          value={`${dropoff.lat.toFixed(6)}, ${dropoff.lng.toFixed(6)}`}
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
          onValueChange={(value) => setVehicleType(value as VehicleType)}
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
          <span className="block sm:inline">${estimatedPrice.toFixed(2)}</span>
        </div>
      )}

      {error && <div className="text-red-500">{error}</div>}

      {bookingConfirmation && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Booking Confirmed!</strong>
          <p className="block sm:inline">{bookingConfirmation.message}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        {isSubmitting ? 'Booking...' : 'Book Now'}
      </Button>
    </form>
  );
};

export default BookingForm;
