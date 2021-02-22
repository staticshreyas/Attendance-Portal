const mongoose = require("mongoose");


const attendanceSchema = new mongoose.Schema({
  stuId: {
    type: String,
    required:true
  },
  classId: {
    type: String,
    required: true
  },
  totLec:{
    type: String,
    required: true
  },
  percent:{
    type: String,
    required: true
  }
});

module.exports = new mongoose.model("Record", attendanceSchema);
