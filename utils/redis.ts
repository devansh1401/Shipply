import { createClient } from 'redis';
import prisma from '../lib/prisma.js';

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.log('Redis Client Error', err));

client.connect().catch(console.error);

const DRIVER_LOCATION_EXPIRY = 300; // 5 minutes
const BOOKING_CACHE_EXPIRY = 3600; // 1 hour

export async function setDriverLocation(
  driverId: string,
  lat: number,
  lng: number
) {
  await client.hSet(`driver:${driverId}`, {
    lat: lat.toString(),
    lng: lng.toString(),
  });
  await client.expire(`driver:${driverId}`, DRIVER_LOCATION_EXPIRY);

  const lastSync = await client.get(`driver:${driverId}:lastSync`);
  if (!lastSync || Date.now() - parseInt(lastSync) > 300000) {
    await prisma.driverLocation.create({
      data: { driverId, lat, lng },
    });
    await client.set(`driver:${driverId}:lastSync`, Date.now().toString());
  }
}

export async function getDriverLocation(driverId: string) {
  const location = await client.hGetAll(`driver:${driverId}`);
  return {
    lat: parseFloat(location.lat || '0'),
    lng: parseFloat(location.lng || '0'),
  };
}

export async function updateBookingTracking(
  bookingId: string,
  lat: number,
  lng: number
) {
  await prisma.trackingUpdate.create({
    data: { bookingId, lat, lng },
  });
  await client.del(`booking:${bookingId}`);
}

export async function cacheBooking(bookingId: string, bookingData: any) {
  await client.set(`booking:${bookingId}`, JSON.stringify(bookingData), {
    EX: BOOKING_CACHE_EXPIRY,
  });
}

export async function getCachedBooking(bookingId: string) {
  const cachedBooking = await client.get(`booking:${bookingId}`);
  return cachedBooking ? JSON.parse(cachedBooking) : null;
}

export async function invalidateBookingCache(bookingId: string) {
  await client.del(`booking:${bookingId}`);
}
