var passport = require('passport');
var User = require('../models/user');

var LocalStrategy = require('passport-local').Strategy;


passport.serializeUser(function (user, done) {
    done(null,user.id);

});

passport.deserializeUser(function (id,done) {
    User.findById(id, function (err,user) {
        done(err,user);
    });

});

passport.use('local-register', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
},
    function (req,email,password,done) {
    var name= req.body.name;


    req.checkBody('email','Invalid email').notEmpty().isEmail();
    req.checkBody('password','Invalid password').notEmpty().isLength({min:4});
     var errors = req.validationErrors();
     if(errors){
         var messages=[];
         errors.forEach(function(error){
             messages.push(error.msg);
         });
         return done(null, false, req.flash('error',messages));
     }

        User.findOne({'email': email},function (err,user) {
        if (err) {
            return done(err);
        }
        if (user) {
            return done(null, false, {message: 'Email already in use.'});
        }
        else {
            var newUser = new User();
            newUser.name =name;
            newUser.email = email;
            newUser.password = newUser.encryptPassword(password);

            newUser.save(function (err, result) {
                if (err) {
                    throw err;
                }
                return done(null, newUser);
            });
        }


});

}));


passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function (req,email,password,done) {

         //Validation Errors
        req.checkBody('email','Invalid Email').notEmpty().isEmail();
        req.checkBody('password','Invalid password').notEmpty();
        var errors = req.validationErrors();
        if(errors){
            var messages=[];
            errors.forEach(function(error){
                messages.push(error.msg);
            });
            return done(null, false, req.flash('error',messages));
        }

        //Find user by email
        User.findOne({'email': email},function (err,user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {message: 'User not found.'});
            }

            if(!user.validPassword(password)){
                return done(null, false, {message: 'Invalid Password'});
            }

            return done(null,user);

        });

    }));

