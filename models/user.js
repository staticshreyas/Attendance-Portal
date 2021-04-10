var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userschema = new Schema({
    name: {type: String, required: true},
    class:{type: String, required: false},
    rollnumber: {type: String, required: false},
    email: {type: String, required: true},
    password: {type: String, required: true},
    who:{type: String, required:true},
    year:{type: String, required:false}
});

userschema.methods.encryptPassword = function(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(5),null)
};

userschema.methods.validPassword = function(password){
    return bcrypt.compareSync(password,this.password);
};

module.exports = mongoose.model('User', userschema);
