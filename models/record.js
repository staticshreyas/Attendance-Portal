const mongoose = require("mongoose");


const recordSchema = new mongoose.Schema({});

module.exports = new mongoose.model("Attendance", recordSchema, "attendance");
