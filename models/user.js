var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var Image=require('./image');

var userschema = new Schema({
    name: {type: String, required: true},
    class:{type: String, required: true},
    rollnumber: {type: String, required: true},
    photo:{type: mongoose.Schema.Types.ObjectId, ref: 'Image'},
    email: {type: String, required: true},
    password: {type: String, required: true}
});

userschema.methods.encryptPassword = function(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(5),null)
};

userschema.methods.validPassword = function(password){
    return bcrypt.compareSync(password,this.password);
};

module.exports = mongoose.model('User', userschema);
