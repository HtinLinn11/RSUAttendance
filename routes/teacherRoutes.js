const express = require('express');
const router = express.Router();

router.post('/create-room', (req, res) => {
  const { roomId, teacherLocation, subject, session, time } = req.body;
  // Logic to create room (can be replaced with WebSocket logic)
  res.status(201).json({ message: `Room ${roomId} created successfully` });
});

module.exports = router;
