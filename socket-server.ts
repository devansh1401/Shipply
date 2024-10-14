import { BookingStatus } from '@prisma/client';
import { createServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';
import prisma from './lib/prisma.js';
import { setDriverLocation, updateBookingTracking } from './utils/redis.js';

const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket: Socket) => {
  console.log('A client connected');

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });

  socket.on('joinBookingRoom', (bookingId: string) => {
    socket.join(`booking:${bookingId}`);
  });

  socket.on('leaveBookingRoom', (bookingId: string) => {
    socket.leave(`booking:${bookingId}`);
  });

  socket.on('driverConnect', (driverId: string) => {
    socket.join(`driver:${driverId}`);
    console.log(`Driver ${driverId} connected`);
  });

  socket.on(
    'driverLocation',
    async (data: {
      driverId: string;
      bookingId: string;
      lat: number;
      lng: number;
    }) => {
      const { driverId, bookingId, lat, lng } = data;
      await setDriverLocation(driverId, lat, lng);

      if (bookingId) {
        await updateBookingTracking(bookingId, lat, lng);
        // Broadcast to clients tracking this booking
        io.to(`booking:${bookingId}`).emit('driverLocationUpdate', {
          lat,
          lng,
        });
      }
    }
  );

  socket.on(
    'driverUpdateBooking',
    async (data: { bookingId: string; status: BookingStatus }) => {
      try {
        const { bookingId, status } = data;
        if (!bookingId) {
          console.error('BookingId is undefined');
          return;
        }
        const updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status },
        });

        // Broadcast to clients tracking this booking
        io.to(`booking:${bookingId}`).emit('bookingUpdated', updatedBooking);
      } catch (error) {
        console.error('Error processing driver booking update:', error);
      }
    }
  );

  socket.on('newBooking', async (bookingId: string) => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });
      if (booking && booking.status === BookingStatus.PENDING) {
        // Emit to all connected clients (drivers)
        io.emit('newBooking', booking);
      }
    } catch (error) {
      console.error('Error processing new booking:', error);
    }
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});
