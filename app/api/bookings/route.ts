import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { calculateDistance, calculatePrice } from '@/utils/pricingUtils';
import { emitNewBooking } from '@/utils/socketEmitter';
import { BookingStatus, VehicleType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType } =
      await req.json();

    // Validate input
    if (
      !pickupLat ||
      !pickupLng ||
      !dropoffLat ||
      !dropoffLng ||
      !vehicleType
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const distance = calculateDistance(
      parseFloat(pickupLat),
      parseFloat(pickupLng),
      parseFloat(dropoffLat),
      parseFloat(dropoffLng)
    );

    const priceEstimate = calculatePrice(distance, vehicleType as VehicleType);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        dropoffLat: parseFloat(dropoffLat),
        dropoffLng: parseFloat(dropoffLng),
        vehicleType: vehicleType as VehicleType,
        status: BookingStatus.PENDING,
        priceEstimate,
        distance,
      },
    });

    // Attempt to emit the new booking event, but don't throw an error if it fails
    try {
      emitNewBooking(booking);
    } catch (socketError) {
      console.warn('Failed to emit new booking event:', socketError);
    }

    return NextResponse.json({ ...booking, id: booking.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
