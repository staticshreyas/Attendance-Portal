var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var multer = require('multer');
var imgModel = require('../models/image');
 
var fs = require('fs');
var path = require('path');

var csrfProtection = csrf();
//router.use(csrfProtection);

/*Get profile*/
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

router.get('/upload',isLoggedIn, (req, res) => {
  var messages= req.flash('error');
  res.render('user/upload',{messages: messages, hasErrors: messages.length >0});


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