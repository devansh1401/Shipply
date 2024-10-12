import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const httpServer = createServer();
const io = new SocketIOServer(httpServer);

export function emitBookingUpdated(bookingId: string, updatedBooking: any) {
  io.to(`booking:${bookingId}`).emit('bookingUpdated', updatedBooking);
}

export function emitNewBooking(booking: any) {
  io.emit('newBooking', booking);
}
