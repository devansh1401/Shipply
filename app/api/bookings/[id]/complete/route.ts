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
      });

      if (!driver) {
        throw new Error('Driver not found for this user');
      }

      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new Error('Driver is not available to accept bookings');
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new Error('Booking is no longer available');
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId, status: BookingStatus.PENDING },
        data: {
          driverId: driver.id,
          status: BookingStatus.ACCEPTED,
        },
      });

      const updatedDriver = await prisma.driver.update({
        where: { id: driver.id },
        data: { status: DriverStatus.BUSY },
      });

      return { updatedBooking, updatedDriver };
    });

    // Emit socket events to notify the user and update driver status
    const io = (await import('@/utils/socket')).default;
    emitBookingUpdated(bookingId, result.updatedBooking);
    emitDriverStatusUpdated(
      result.updatedDriver.id,
      result.updatedDriver.status
    );

    return NextResponse.json(result.updatedBooking);
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
