import { createClient } from 'redis';
import prisma from '../lib/prisma.js';

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.log('Redis Client Error', err));

client.connect().catch(console.error);

export async function setDriverLocation(
  driverId: string,
  lat: number,
  lng: number
) {
  await client.hSet(`driver:${driverId}`, {
    lat: lat.toString(),
    lng: lng.toString(),
  });

  // Periodically sync to database (e.g., every 5 minutes)
  const shouldSync = Math.random() < 0.1; // 10% chance to sync on each update
  if (shouldSync) {
    await prisma.driverLocation.create({
      data: { driverId, lat, lng },
    });
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
}
