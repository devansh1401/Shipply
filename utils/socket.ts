import { io } from 'socket.io-client';

const socket = io('http://localhost:4000'); // Update the port to match the Socket.io server

export default socket;
