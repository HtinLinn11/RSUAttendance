const express = require('express');
const router = express.Router();

router.post('/join-room', (req, res) => {
  const { roomId, studentId, studentName, studentLocation } = req.body;
  // Logic to validate and join room
  res.status(200).json({ message: 'Student added to room' });
});

module.exports = router;
