// app/api/bookings/[id]/accept/route.ts
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { emitBookingUpdated } from '@/utils/socketEmitter';
import { BookingStatus, DriverStatus } from '@prisma/client';
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

    // Emit socket event with driver details
    emitBookingUpdated(bookingId, result.updatedBooking, driverDetails);

    return NextResponse.json({
      ...result.updatedBooking,
      driver: driverDetails,
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
