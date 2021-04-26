var passport = require('passport');
var User = require('../models/user');
const MailSender = require('../mail')

var LocalStrategy = require('passport-local').Strategy;


passport.serializeUser(function (user, done) {
    done(null, user.id);

});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });

});

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(email)) {
        if (email.indexOf("@somaiya.edu", email.length - "@somaiya.edu".length) !== -1) {
            return 1
        }
    }
}

function validatePassword(password) {
    var p = password
    errors = [];
    if (p.length < 6) {
        errors.push("Your password must be at least 6 characters.");
    }
    if (p.length > 15) {
        errors.push("Your password must be atmost 15 characters.");
    }
    if (p.search(/[A-Z]/i) < 0) {
        errors.push("Your password must contain at least one upercase letter.");
    }
    if (p.search(/[a-z]/i) < 0) {
        errors.push("Your password must contain at least one lowercase letter.");
    }
    if (p.search(/[0-9]/) < 0) {
        errors.push("Your password must contain at least one digit.");
    }
    if (p.search(/[!@#$%^&*]/) < 0) {
        errors.push("Your password must contain at least one special character.");
    }
    return errors;
}

passport.use('local-register', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
},
    function (req, email, password, done) {
        var name = req.body.name;
        var classs = req.body.class
        var rollnumber = req.body.rollnumber
        var teacher = req.body.teacher
        var student = req.body.student
        var messages = [];
        var year = req.body.year
        req.checkBody('email', 'Invalid email').notEmpty().isEmail();
        req.checkBody('password', 'Invalid password').notEmpty();
        var errors = req.validationErrors();
        if (errors) {
            errors.forEach(function (error) {
                messages.push(error.msg);
            });
            return done(null, false, req.flash('error', messages));
        }
        else if (!validateEmail(email)) {
            messages.push("Email Domain: @somaiya.edu required")
            return done(null, false, req.flash('error', messages));
        }
        else if ((validatePassword(password)).length != 0) {
            messages = validatePassword(password)
            return done(null, false, req.flash('error', messages));
        }
        else if (!teacher && !student) {
            messages.push("Please check the tickbox")
            return done(null, false, req.flash('error', messages));
        }
        else if (year == "Year") {
            messages.push("Please select a year")
            return done(null, false, req.flash('error', messages));
        }
        else if (classs == "Class") {
            messages.push("Please select a class")
            return done(null, false, req.flash('error', messages));
        }
        else {
            if (rollnumber) {
                User.findOne({ 'rollnumber': rollnumber }, function (err, user) {
                    if (err) {
                        return done(err)
                    }
                    if (user) {
                        console.log(rollnumber)
                        return done(null, false, { message: 'Roll number already in use.' });
                    }
                    else {
                        User.findOne({ 'email': email }, function (err, user) {
                            if (err) {
                                return done(err);
                            }
                            if (user) {
                                return done(null, false, { message: 'Email already in use.' });
                            }
                            else {
                                var newUser = new User();
                                newUser.name = name;
                                newUser.email = email;
                                newUser.password = newUser.encryptPassword(password);
                                newUser.class = classs
                                newUser.rollnumber = rollnumber
                                if (teacher == "0") {
                                    newUser.who = teacher
                                }
                                else if (student) {
                                    newUser.who = student
                                    if (!year) {
                                        messages.push("Please enter all details")
                                        return done(null, false, req.flash('error', messages));
                                    }
                                    else {
                                        newUser.year = year
                                    }
                                }
                                else {
                                    newUser.who = ""
                                }
                                newUser.save(function (err, result) {
                                    if (err) {
                                        throw err;
                                    }
                                    return done(null, newUser);
                                });
                            }



                        });
                    }
                })
            } else {
                User.findOne({ 'email': email }, function (err, user) {
                    if (err) {
                        return done(err);
                    }
                    if (user) {
                        return done(null, false, { message: 'Email already in use.' });
                    }
                    else {
                        var newUser = new User();
                        newUser.name = name;
                        newUser.email = email;
                        newUser.password = newUser.encryptPassword(password);
                        newUser.class = classs
                        newUser.rollnumber = rollnumber
                        if (teacher == "0") {
                            newUser.who = teacher
                        }
                        else if (student) {
                            newUser.who = student
                            if (!year) {
                                messages.push("Please enter all details")
                                return done(null, false, req.flash('error', messages));
                            }
                            else {
                                newUser.year = year
                            }
                        }
                        else {
                            newUser.who = ""
                        }
                        newUser.save(function (err, result) {
                            if (err) {
                                throw err;
                            }
                            return done(null, newUser);
                        });
                    }



                });
            }

        }

    }));


passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
},
    function (req, email, password, done) {

        //Validation Errors
        req.checkBody('email', 'Invalid Email').notEmpty().isEmail();
        req.checkBody('password', 'Invalid password').notEmpty();
        var errors = req.validationErrors();
        if (errors) {
            var messages = [];
            errors.forEach(function (error) {
                messages.push(error.msg);
            });
            return done(null, false, req.flash('error', messages));
        }

        //Find user by email
        User.findOne({ 'email': email }, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, { message: 'User not found.' });
            }

            if (!user.validPassword(password)) {
                return done(null, false, { message: 'Invalid Password' });
            }

            return done(null, user);

        });

    }));

