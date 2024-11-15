const XLSX = require('xlsx');
const fs = require('fs');

async function exportToExcel(attendanceData, roomId) {
  const ws = XLSX.utils.json_to_sheet(attendanceData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

  const filePath = `attendance_${roomId}.xlsx`;
  XLSX.writeFile(wb, filePath);
  console.log(`Attendance exported to ${filePath}`);
}

module.exports = { exportToExcel };
