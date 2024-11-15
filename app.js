require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, // Example: 'https://your-client.netlify.app'
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);

const rooms = {}; // To store active rooms and their data

io.on('connection', (socket) => {
  console.log('A user connected');

  // Teacher creates a room
  socket.on('create-room', (data) => {
    const { roomId, teacherLocation, subject, session, time } = data;
    rooms[roomId] = {
      teacherLocation,
      subject,
      session,
      time,
      attendance: [],
    };
    socket.join(roomId);
    console.log(`Room ${roomId} created by teacher`);
  });

  // Student joins a room
  socket.on('student-join', (data) => {
    const { roomId, studentId, studentName, studentLocation } = data;
    const room = rooms[roomId];

    if (!room) {
      socket.emit('attendance-error', 'Room not found');
      return;
    }

    const { validateGPS } = require('./utils/gpsValidation');
    if (!validateGPS(room.teacherLocation, studentLocation)) {
      socket.emit('attendance-error', 'You are not near the teacher');
      return;
    }

    room.attendance.push({
      studentId,
      studentName,
      timestamp: new Date().toISOString(),
    });

    socket.emit('attendance-success', 'Attendance marked successfully!');
  });

  // Teacher ends a room
  socket.on('end-room', async (roomId) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('room-error', 'Room not found');
      return;
    }

    const { exportToExcel } = require('./utils/excelExport');
    await exportToExcel(room.attendance, roomId);

    delete rooms[roomId];
    console.log(`Room ${roomId} ended`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
