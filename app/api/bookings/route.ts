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

    // Validate vehicleType
    if (!Object.values(VehicleType).includes(vehicleType)) {
      return NextResponse.json(
        { error: 'Invalid vehicle type' },
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

    // Emit the new booking event
    try {
      await emitNewBooking(booking);
      console.log('New booking event emitted successfully');
    } catch (socketError) {
      console.error('Failed to emit new booking event:', socketError);
      // Consider if you want to handle this error differently
    }

    return NextResponse.json(booking, { status: 201 });
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let whereClause: any = { userId: session.user.id };
    if (status) {
      whereClause.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { driver: true }, // Include driver details if needed
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
