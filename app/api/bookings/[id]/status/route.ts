import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';
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
    const { status } = await req.json();

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId, driverId: driver.id },
      data: { status: status as BookingStatus },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
