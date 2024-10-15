// app/api/bookings/[id]/complete/route.ts
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import {
  emitBookingUpdated,
  emitDriverStatusUpdated,
} from '@/utils/socketEmitter';
import { BookingStatus, DriverStatus, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const userId = session.user.id;

    const result = await prisma.$transaction(async (prisma) => {
      const driver = await prisma.driver.findUnique({
        where: { userId: userId },
        include: { vehicle: true },
      });

      if (!driver) {
        throw new Error('Driver not found for this user');
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Allow completion from any state except COMPLETED or CANCELLED
      if (
        booking.status === BookingStatus.COMPLETED ||
        booking.status === BookingStatus.CANCELLED
      ) {
        throw new Error('Booking cannot be completed at this time');
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
        },
      });

      const updatedDriver = await prisma.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.AVAILABLE },
      });

      return { updatedBooking, updatedDriver, driver };
    });

    // Prepare driver details for the response
    const driverDetails = result.driver
      ? {
          id: result.driver.id,
          name: result.driver.name,
          vehicleType: result.driver.vehicle?.type,
          plateNumber: result.driver.vehicle?.plateNumber,
        }
      : null;

    // Emit socket events to notify the user and update driver status
    emitBookingUpdated(bookingId, result.updatedBooking, driverDetails);
    emitDriverStatusUpdated(
      result.updatedDriver.id,
      result.updatedDriver.status
    );

    return NextResponse.json({
      ...result.updatedBooking,
      driver: driverDetails,
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Booking not found or cannot be completed' },
          { status: 404 }
        );
      }
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
