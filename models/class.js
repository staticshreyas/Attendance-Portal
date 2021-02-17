const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required:true
  },
  students: [    {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required:true
    }
  ],
  dateCreated: {
    type: Date,
    default: Date.now
  },
});

module.exports = new mongoose.model("Class", classSchema);

