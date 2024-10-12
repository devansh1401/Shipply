import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { emitBookingUpdated } from '@/utils/socketEmitter';
import { BookingStatus, Prisma } from '@prisma/client';
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

    const updatedBooking = await prisma.$transaction(async (prisma) => {
      const driver = await prisma.driver.findUnique({
        where: { userId: userId },
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

      if (booking.status !== BookingStatus.PENDING) {
        throw new Error('Booking is no longer available');
      }

      return await prisma.booking.update({
        where: { id: bookingId, status: BookingStatus.PENDING },
        data: {
          driverId: driver.id,
          status: BookingStatus.ACCEPTED,
        },
      });
    });

    // Emit socket event to notify the user
    const io = (await import('@/utils/socket')).default;
    emitBookingUpdated(bookingId, updatedBooking);

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error accepting booking:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Booking not found or already accepted' },
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
