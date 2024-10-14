import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, vehicleType, plateNumber } = await req.json();

    // Check if driver already exists
    let driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (driver) {
      return NextResponse.json(
        { error: 'Driver already exists' },
        { status: 400 }
      );
    }

    // Create new driver
    driver = await prisma.driver.create({
      data: {
        name,
        email: session.user.email!,
        phone,
        status: 'AVAILABLE',
        user: {
          connect: { id: session.user.id },
        },
        vehicle: {
          create: {
            type: vehicleType,
            plateNumber,
            capacity:
              vehicleType === 'BIKE' ? 1 : vehicleType === 'CAR' ? 4 : 8,
          },
        },
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { email: session.user.email },
      include: { vehicle: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
