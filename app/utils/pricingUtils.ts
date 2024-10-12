import { VehicleType } from '@prisma/client';

const EARTH_RADIUS_KM = 6371;

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Number(distance.toFixed(2)); // Round to 2 decimal places
}

const BASE_PRICE = 5; // Base price in your currency
const PRICE_PER_KM = {
  [VehicleType.BIKE]: 0.5,
  [VehicleType.CAR]: 1,
  [VehicleType.TRUCK]: 1.5,
};

export function calculatePrice(
  distance: number,
  vehicleType: VehicleType
): number {
  const pricePerKm = PRICE_PER_KM[vehicleType];
  let price = BASE_PRICE + distance * pricePerKm;

  // Apply a discount for longer distances
  if (distance > 100) {
    price *= 0.9; // 10% discount for distances over 100 km
  }
  if (distance > 500) {
    price *= 0.95; // Additional 5% discount for distances over 500 km
  }

  return Number(price.toFixed(2)); // Round to 2 decimal places
}
