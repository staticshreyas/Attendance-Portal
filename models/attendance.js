const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Class',
    required:true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required:true
  },
  dateTaken: {
    type: Date,
    default: Date.now
  },
});

module.exports = new mongoose.model("Attendance", attendanceSchema);

