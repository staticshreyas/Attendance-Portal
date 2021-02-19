var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var multer = require('multer');
var imgModel = require('../models/image');
var classModel = require('../models/class');
var attendanceModel = require('../models/attendance');
 
var fs = require('fs');
var path = require('path');

const request = require('request');

var csrfProtection = csrf();
//router.use(csrfProtection);

/*Get dashboard*/
router.get('/dashboard',isLoggedIn,function (req,res,next) {
  if(req.user.who=="1")
  {
    console.log(req.user)
      res.render('user/dashboard', {
          user: req.user,
      });
  }
  else if(req.user.who=="0")
  {
    console.log(req.user)
    res.render('user/teacher-dashboard', {
      user: req.user,
  });
  }
});

/*Get profile*/
router.get('/profile',isLoggedIn,function (req,res,next) {
  if(req.user.who=="1")
  {
    console.log(req.user)
      res.render('user/profile', {
          user: req.user,
      });
  }
  else if(req.user.who=="0")
  {
    console.log(req.user)
    res.render('user/teacher-profile', {
      user: req.user,
  });
  }
});

/*Get Classrooms*/
router.get('/teacher-classrooms',isLoggedIn,function (req,res,next) {

    classModel.find({'owner':req.user._id},function(err,classrooms){
      if(err){
        return done(err);
      }
      else{
        console.log(classrooms)
        res.render('user/teacher-classrooms', {
          user: req.user,
          classrooms:classrooms
        });
    }
  
  });
});

/*Get Classroom details*/
router.get('/class-details/:id',isLoggedIn,function (req,res,next) {

  classModel.findById(req.params.id,function(err,classroom){
    if(err){
      return done(err);
    }
    else{
      console.log(classroom)
      res.render('user/classDetails', {
        user: req.user,
        classroom:classroom
      });
    }
  });

 
});


/* Make student xl file*/
router.get('/db_create', function(req, res, next) {

  const { spawn } = require("child_process");

  const env = spawn('../mip_env/Scripts/python',['./Py-Scripts/db_maker.py'])

  env.stderr.on( 'data', data => {
    console.log( `stderr: ${data}` );
} );

  env.on("close", code=>{
    console.log(`child process exited with code ${code}`);

    res.render('user/teacher-dashboard', {user: req.user});
  })
});

router.get('/take_attendance', function(req, res, next) {

  var messages= req.flash('error');
  request('http://127.0.0.1:5000/camera', function (error, response, body) {
    console.log(body)
    if(body)
    {
    res.render('user/classDetails',{messages: messages, hasErrors: messages.length >0});
    }
  });
});



/*add new class*/
router.get('/create-class',isLoggedIn, (req, res)=>{
  console.log(req.user);
  // var messages= req.flash('error');
  res.render('user/create-class');
});

router.post('/create-class', (req, res, next) => {
  console.log("hereeee");
  var newClass={
    name:req.body.name,
    description:req.body.description,
    owner:req.user._id,
  }

  classModel.create(newClass, (err, item) => {
    if (err) {
        console.log(err);
    }
    else {
        item.save();
        res.redirect('/user/teacher-classrooms');
    }
  });
});


var storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, __dirname+'../../public/assets/uploads')
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname)
  }
});

var upload = multer({ storage: storage }); 

router.get('/upload',isLoggedIn, (req, res) => {
  var messages= req.flash('error');
  res.render('user/upload',{messages: messages, hasErrors: messages.length >0});

});

router.post('/upload', upload.single('photo'), (req, res, next) => {
 
  var obj = {
    user: req.user,
      img: {
          data: fs.readFileSync(path.join(__dirname+'../../public/assets/uploads/' + req.file.filename)),
          contentType: 'image/png'
      }
  }
  imgModel.create(obj, (err, item) => {
      if (err) {
          console.log(err);
      }
      else {
          item.save();
          res.redirect('/user/dashboard');
      }
  });
});


router.get('/logout',isLoggedIn,function (req,res,next) {
  req.logout();
  res.redirect('/');
});

router.use('/',notLoggedIn, function (req,res,next)
{
next();
});

/* GET users listing. */
router.get('/login', function(req, res, next){
  var messages= req.flash('error');
  res.render('user/login',{ messages: messages, hasErrors: messages.length >0});
});

router.post('/login',passport.authenticate('local-login',{
  failureRedirect: '/user/login',
  failureFlash: true

}),function (req,res,next) {
  if(req.session.oldurl){
      var oldurl=req.session.oldurl;
      req.session.oldurl=null;
      res.redirect(oldurl);
  }else {
      res.redirect('/user/dashboard');
  }

});

router.get('/register', function(req, res, next){
  var messages= req.flash('error');
  res.render('user/register',{ messages: messages, hasErrors: messages.length >0});
});


router.post('/register',passport.authenticate('local-register',{
  failureRedirect: '/user/register',
  failureFlash: true

}),function (req,res,next) {
  if(req.session.oldurl){
      var oldurl=req.session.oldurl;
      req.session.oldurl=null;
      res.redirect(oldurl);
  }else {
      res.redirect('/user/dashboard');
  }

});

router.get('/teacher-register', function(req, res, next){
  var messages= req.flash('error');
  res.render('user/teacher-register',{ messages: messages, hasErrors: messages.length >0});
});


router.post('/teacher-register',passport.authenticate('local-register',{
  failureRedirect: '/user/teacher-register',
  failureFlash: true

}),function (req,res,next) {
  if(req.session.oldurl){
      var oldurl=req.session.oldurl;
      req.session.oldurl=null;
      res.redirect(oldurl);
  }else {
      res.redirect('/user/dashboard');
  }

});


module.exports = router;

function isLoggedIn(req,res,next) {
  if (req.isAuthenticated()){
      return next();
  }
  res.redirect('/user/login');
}

function notLoggedIn(req,res,next) {
  if (!req.isAuthenticated()){
      return next();
  }
  res.redirect('/user/login');
}