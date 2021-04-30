const mongoose = require("mongoose");

let alphabets = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";

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
  totLec: {
    type: Number,
    required: false,
    default:0
  },
  classCode:{
    type:String,
    required:false,
    default:function generateCode() {
      code=''
      for(i=0;i<8;i++){
        r=Math.floor(Math.random() * 10);
        if(r<6){
          code=code+alphabets[Math.floor(Math.random() * alphabets.length)]
        }
        else{
          code=code+Math.floor(Math.random() * 10);
        }
      }
      return code;
    }
  },
  colour: {
    type: String,
    required: false,
    default:""
  }
});

module.exports = new mongoose.model("Class", classSchema);

