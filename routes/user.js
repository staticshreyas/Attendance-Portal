var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var multer = require('multer');
var userModel = require('../models/user');
var imgModel = require('../models/image');
var classModel = require('../models/class');
var attendanceModel = require('../models/attendance');
 
var fs = require('fs');
var path = require('path');
const Excel = require('exceljs')

var upload = multer({ storage: storage }); 

const request = require('request');

let totalClasses=0
let totalStudents=0

function calc(){
  classModel.count({},function(err,count){
    totalClasses=count
  })
  userModel.count({who:"1"},function(err,count){
    totalStudents=count
  })
}


/*Get dashboard*/
router.get('/dashboard',isLoggedIn,function (req,res,next) {

  if(req.user.who=="1")
  {
    //console.log(req.user)
      res.render('user/dashboard', {
          user: req.user,
      });
  }
  else if(req.user.who=="0")
  {
   // console.log(req.user)
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
router.get('/teacher-classrooms',isLoggedIn, async(req,res,next)=>{
  let classrooms=[];
  let users=[];
  calc();
  await classModel.find({'owner':req.user._id},(err,classrooms)=>{
    if(err){
      return done(err);
    }
    else{
      this.classrooms=classrooms;
    }
    });  
  await userModel.find({who:"1"},(err,users)=>{
    if(err){
      return done(err)
    }
    else{
      this.users=users;
    }
  });   
  this.classrooms.map((classroom)=>{
    let stuArray=[];
    classroom.students.map((stuId)=>{
      this.users.map((user)=>{
          if(stuId.equals(user._id)){
            stuArray.push(user);
          }
      })
      classroom.studentDetails=stuArray;
    })
  })
  res.render('user/teacher-classrooms', {
    user: req.user,
    classrooms:this.classrooms,
    totClass: totalClasses,
    totStu: totalStudents
  });
});

/*Get Classroom details*/
router.get('/class-details/:id',isLoggedIn,function (req,res,next) {
  calc()
  classModel.findById(req.params.id,function(err,classroom){
    if(err){
      return done(err);
    }
    else{
      let stuArray=[];
      classroom.students.map((stuId)=>{
        userModel.findById(stuId,function(err,student){
          stuArray.push(student);
        })
      });
      res.render('user/classDetails', {
        user: req.user,
        classroom:classroom,
        students:stuArray,
        totClass: totalClasses,
        totStu: totalStudents
      });
    }
  });

 
});

/* Create xls file of students in class*/
router.get('/xl_create/:id', function(req,res,next){

  let workbook = new Excel.Workbook()
  let worksheet = workbook.addWorksheet('students_db')

  worksheet.columns = [
    {header: 'name', key: 'name'},
    {header: 'image', key: 'image'},
    {header: 'roll_no', key: 'roll_no'},
    {header: 'classid', key: 'classid'}
  ]

  var query=classModel.find({_id: req.params.id}).select({"students": 1, "_id":1})

  query.exec(function(err, data){
    if(err){
      console.log(err)
    }
    else{
      //console.log(data)
      for(i=0;i<data[0].students.length;i++)
      {
        var a=data[0].students[i]
        //console.log(a)
        userModel.findById(a, function(err,student){

          if(err){
            console.log(err)
          }

          else{
            //console.log(student)
            var obj={}
            obj["name"]=student.name
            obj["image"]=student.name+".jpg"
            obj["roll_no"]=student.rollnumber
            obj["classid"]=data[0].id
            //console.log(obj)

            worksheet.addRow(obj)
            workbook.xlsx.writeFile('./Py-Scripts/students/students_db.xlsx')
          }
        })

      }       
      res.redirect('/user/class-details/'+req.params.id);
    }
  })


})

/* Take attendance of students in class*/
router.get('/take_attendance/:id', function(req, res, next) {

  var messages= req.flash('error');
  request('http://127.0.0.1:5000/camera', function (error, response, body) {
    console.log(body)
  });
  res.render('user/cameraOn');
});


/* Add new class*/
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


/* Add new student in particular class*/
router.get('/class-details/:id/students/new',isLoggedIn, (req, res)=>{
  //console.log(req.params.id);
  
  userModel.find({'who':"1"},function(err,users){
    if(err){
      return done(err);
    }
    else{
      //console.log(users);
      classModel.findById(req.params.id,function(err,classroom){
        if(err){
          return done(err);
        }
        else{
          let notInClassStudents=[];
          users.map((user)=>{
            flag=0
            classroom.students.map((stuId)=>{
              if (stuId.equals(user._id)){
                flag=1
              }
            });
            if(flag===0){
              notInClassStudents.push(user);
            }
          });
  
          res.render('user/addStudents', {
            users: notInClassStudents,
            classroom:classroom
          });
        }
      });
    }
  });
});

router.get('/class-details/:id/students/new/:stuId', (req, res, next) => {
  var students=req.params.stuId;
  classModel.findOneAndUpdate({_id:req.params.id},{$push:{students:students}},{new:true},function(err,updatedClass){
		if(err){
			console.log(err);
		}
		else{
      //console.log(updatedClass);
			res.redirect('/user/class-details/'+req.params.id+'/students/new');
		}
	});
});


/* View All Registered Students*/
router.get('/allStudents', (req, res, next) => {

  userModel.find({'who':"1"},function(err,users){
    if(err){
      return done(err);
    }
    else{
      res.render('user/allStudents', {
        users: users,
      });
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