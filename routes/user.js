var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');

var csrfProtection = csrf();
router.use(csrfProtection);

/*Get profile*/
router.get('/dashboard',isLoggedIn,function (req,res,next) {
      res.render('user/dashboard', {
          user: req.user,
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
  res.render('user/login',{csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length >0});
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
  res.render('user/register',{csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length >0});
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