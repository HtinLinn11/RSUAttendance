require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL_LOCAL,  // First allowed URL
      process.env.CLIENT_URL_NETLIFY,  // Second allowed URL
      process.env.CLIENT_URL_EXTRA,  // Third allowed URL
    ],
    methods: ['GET', 'POST'],
  },
});

const rooms = {}; // To store active rooms and their data


// Function to log the number of connected users and rooms
function logServerStats() {
  console.log('--- Server Active ---');
  console.log(`Connected Users: ${io.engine.clientsCount}`);
  console.log(`Active Rooms: ${rooms}`);
  console.log('--------------------');
}

// Log server stats every 5 minutes
setInterval(logServerStats, 5 * 60 * 1000); // 5 minutes in milliseconds

io.on('connection', (socket) => {
  console.log('A user connected');
  console.log(`Currently connected users: ${io.engine.clientsCount}`);

  // Teacher creates and joins a room
  socket.on('createRoom', (roomData) => {
  const { roomId, subjectCode, section, duration, location, createdAt, limitAttendance, maxDistance, lateThreshold } = roomData;
  console.log(roomData);

  // Check if the room already exists
  if (rooms[roomId]) {
    socket.emit('error', { message: 'Room already exists' });
    return;
  }

  // Create the room
  rooms[roomId] = {
    subjectCode,
    section,
    duration,
    location,
    createdAt,
    limitAttendance,
    maxDistance,
    lateThreshold,
    attendees: [
    ],
  };

  // console.log(rooms[roomId]);

   console.log(`Room created: ${roomId} with subject ${subjectCode}`);
  // Listen for the "ping" event from the client
  socket.on('ping', (roomId) => {
    console.log('Room with ID', roomId, "still active.");
    socket.emit('pong')}); 

  // Notify the teacher of successful creation and joining
  socket.emit('roomCreated', {
    roomId,
    message: 'Room created successfully',
  });

  });
    // Handle request for checking attendance
  socket.on('getRoomData', (roomId) => {
    // console.log(roomId, rooms);
    if (rooms[roomId]) {
      // Emit the list of attendees for the requested room to the teacher
      const roomData = rooms[roomId];
      socket.emit('roomData', roomData); // Emit only to the requesting teacher
    } else {
      // Room not found
      socket.emit('roomNotFound');
      socket.emit('error', { message: 'Room not found' });
    }
  });

  socket.on("joinRoomTeacher", (roomID) => {
    const room = rooms[roomID]; // Fetch the room from the rooms object
  
    if (!room) {
      // console.log("Room not found JOIN")
      socket.emit('roomNotFound');
      socket.emit("error", { message: "Room not found" });
      return;
    }
  
    // console.log(`Teacher joined room ${roomID}`);
  
    // Add the teacher to the room in Socket.IO (roomId is the identifier)
    socket.join(roomID);
  
    socket.emit('joinedRoom', { roomID, message: 'Joined the room successfully' });
  });
  

  // Student joins a room
  socket.on('recordAttendence', (data) => {
    const { roomId, studentName, studentId, attendenceStatus, studentTime } = data;
    //console.log(data);

    if (rooms[roomId]) {
      const room = rooms[roomId];
      // Add student to room attendance
      room.attendees.push({ studentName, studentId, attendenceStatus, studentTime});

      // console.log(`${studentName} joined room ${roomId}`);
      // Add the student to the room in Socket.IO (roomId is the identifier)
      socket.emit("studentAttended", {studentName, studentId})
      socket.to(roomId).emit("studentAttendedAll", {studentName, studentId, attendenceStatus, studentTime})
      // Notify only the clients in the room (e.g., teacher and students in that room)
    } else {
      socket.emit('error', { message: 'Room not found' });
    }
  });

  // Teacher ends a room
  socket.on('end-room', async (roomId) => {
    const room = rooms[roomId];
    if (!room) {
      //console.log("Room not found")
      socket.emit('roomNotFound');
      socket.emit('error', 'Room not found');
      return;
    }
    delete rooms[roomId];
    console.log(`Room ${roomId} ended`);
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected');
    console.log(`Currently connected users: ${io.engine.clientsCount}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
