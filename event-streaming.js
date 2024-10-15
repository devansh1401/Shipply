const { sendMessage } = require('./kafka-producer');
const { startConsumer } = require('./kafka-consumer');

function streamBookingEvents(booking) {
  sendMessage('booking-events', booking);
}

function streamDriverLocationUpdates(driverLocation) {
  sendMessage('driver-locations', driverLocation);
}

function processBookingEvents(bookingHandler) {
  startConsumer('booking-events', bookingHandler);
}

function processDriverLocationUpdates(locationHandler) {
  startConsumer('driver-locations', locationHandler);
}

module.exports = {
  streamBookingEvents,
  streamDriverLocationUpdates,
  processBookingEvents,
  processDriverLocationUpdates,
};
