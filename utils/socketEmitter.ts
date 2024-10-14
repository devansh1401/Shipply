import { Booking, BookingStatus, DriverStatus } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: any) {
  io = new SocketIOServer(httpServer);
  return io;
}

export function getSocketIO() {
  return io;
}

export function emitBookingUpdated(
  bookingId: string,
  updatedBooking: Booking,
  driverDetails: {
    id: string;
    name: string;
    vehicleType?: string;
    plateNumber?: string;
  } | null
) {
  if (io) {
    io.to(`booking:${bookingId}`).emit('bookingUpdated', {
      ...updatedBooking,
      driver: driverDetails,
    });
  } else {
    console.warn('Socket.IO not initialized. Skipping emitBookingUpdated.');
  }
}

export function emitNewBooking(booking: Booking) {
  if (io) {
    io.emit('newBooking', booking);
  } else {
    console.warn('Socket.IO not initialized. Skipping emitNewBooking.');
  }
}

export function emitDriverStatusUpdated(
  driverId: string,
  status: DriverStatus
) {
  if (io) {
    io.to(`driver:${driverId}`).emit('driverStatusUpdated', {
      driverId,
      status,
    });
  } else {
    console.warn(
      'Socket.IO not initialized. Skipping emitDriverStatusUpdated.'
    );
  }
}

export function emitDriverUpdateBooking(
  bookingId: string,
  status: BookingStatus
) {
  if (io) {
    io.emit('driverUpdateBooking', { bookingId, status });
  } else {
    console.warn(
      'Socket.IO not initialized. Skipping emitDriverUpdateBooking.'
    );
  }
}
