var createError = require('http-errors');
var express = require('express');
var bodyParser= require('body-parser');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport'); 
var flash = require('connect-flash');
const validator= require('express-validator');
var MongoStore= require('connect-mongo')(session);
const Handlebars = require('handlebars');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');

var app = express();

mongoose.connect('mongodb://localhost:27017/attendance_portal',{useNewUrlParser: true, useUnifiedTopology: true})

require('./config/passport');

const hbs=expressHbs.create({
  defaultLayout: 'layout',
  extname: '.hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars),

  //create custom helpers
  helpers:{
    maxTwoItems:function(context,options){
      items=[]
      if(context.length<=2)
        limit=context.length
      else
        limit=2
      for (var i = 0;i<limit; i++) {
         items.push(options.fn(context[i]));
      }
      return items;
    }
  }
})

// view engine setup
app.engine('.hbs',hbs.engine);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection}),
  cookie: {maxAge: 100*60*1000}
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req, res, next) {
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  next();
});

app.use('/user', userRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

port=3000
app.listen(port,function(err){
  if(err){
    console.log(err)
  }
  else{
    console.log("Listening to port:",port)
  }
})


module.exports = app;
