var express = require('express');
var router = express.Router();
var passport = require('passport');
var userModel = require('../models/user');
var imgModel = require('../models/image');
var classModel = require('../models/class');
var recordModel = require('../models/record');
var multer = require('multer');
const mongo = require('mongodb');

var api = require('../api/api')

var fs = require('fs');
var path = require('path');

const request = require('request');

let totalClasses = 0
let totalStudents = 0

//Function that calculates the total classes and total students in the portal
function calc() {
  classModel.count({}, function (err, count) {
    totalClasses = count
  })
  userModel.count({ who: "1" }, function (err, count) {
    totalStudents = count
  })
}

/*Get defaulter list*/
router.get('/defaulterStudents', isLoggedIn, function (req, res, next) {
  console.log(req.user.who)
  var obj = api.forTeacherClasses(req.user._id)

  obj.then(classes => {
    defaultersList = []
    for (i = 0; i < classes.length; i++) {
      for (j = 0; j < classes[i].studentDetails.length; j++) {
        var a = classes[i].studentDetails[j]
        if (parseFloat(a.percent) < 75) {
          defaultersList.push({ studentName: a.name, studentRollno: a.rollnumber, studentEmail: a.email, className: classes[i].name, studentCounts: a.counts, classCounts: classes[i].totLec, studentPercent: a.percent.toString() })
        }
      }
    }
    console.log(defaultersList);

    res.render('user/defaulterStudents', {
      defaulterStudents: defaultersList,
    });
  })
});

/*Get dashboard*/
router.get('/dashboard', isLoggedIn, function (req, res, next) {
  console.log(req.user.who)
  if (req.user.who == "1") {
    calc()
    if (req.user.who == "1") {
      var obj = api.forUserClasses(req.user._id)
      obj.then(ob => {

        for (i = 0; i < ob.classes.length; i++) {
          var classroom = ob.classes[i]
          for (j = 0; j < classroom.studentDetails.length; j++) {
            var student = classroom.studentDetails[j]
            if (student.name == req.user.name) {
              ob.classes[i].studentDetails = student
              break
            }
          }
        }
        //console.log(ob.classes[0])
        res.render('classroom/user-classes', {
          user: req.user,
          totClass: totalClasses,
          classrooms: ob.classes,
          attendance: ob.attendance,
          totLec: ob.totalLecs,
          totStuClass: ob.classes.length,
        });
      })
    }
  }
  else if (req.user.who == "0") {

    calc();
    var obj = api.forTeacherClasses(req.user._id)
    var all_lectures_conducted = api.allLecTeacher(req.user._id) // array of all lectures taken by this teacher

    obj.then(classes => {
      //console.log(classes)
      var totalLectures = 0
      var totalP = 0;
      for (i = 0; i < classes.length; i++) {
        totalLectures += classes[i].totLec
      }
      for (i = 0; i < classes.length; i++) {
        totalP = totalP + (parseInt(classes[i].totalP))
      }
      if (totalLectures === 0) {
        var avgPercent = 0
      }
      else {
        var avgPercent = (((totalP) / (totalLectures * totalStudents)) * 100).toFixed(2).toString()
      }

      totClassAttStats = []
      for (i = 0; i < classes.length; i++) {
        var obj = { className: classes[i].name, classAttPer: classes[i].totalPercent.toString(), classAttLec: classes[i].totLec }
        totClassAttStats.push(obj)
      }
      //console.log(totClassAttStats)

      topAttPerStuPerClass = []
      for (i = 0; i < classes.length; i++) {
        max = 0
        for (j = 0; j < classes[i].studentDetails.length; j++) {
          var a = classes[i].studentDetails[j]
          var b = classes[i].studentDetails[max]
          if (parseFloat(a.percent) > parseFloat(b.percent)) {
            max = j
          }
        }
        var b = classes[i].studentDetails[max]
        if (b) {
          if (parseFloat(b.percent) != 0) {
            topAttPerStuPerClass.push({ className: classes[i].name, studentName: b.name, studentCounts: b.counts, studentPercent: b.percent.toString() })
          }
        }
      }

      var line_data_as_object = {}
      var bar_data_as_object = {}
      all_lectures_conducted.then(lectures => {

        for (lecture of lectures) {
          // formatting total lectures data
          var time_string = lecture._doc.AttendanceRecord;                      // timestamp of attendance record
          var time_components = time_string.split(" ");                         // day, month, date, time, year
          var year_month = time_components[4] + ": " + time_components[1];     //merge year + month
          line_data_as_object[year_month] ? line_data_as_object[year_month] += 1 : line_data_as_object[year_month] = 1;  //add the lectures

          // separating mass bunk data
          if (lecture._doc.data.Name.length == 0) {
            bar_data_as_object[year_month] ? bar_data_as_object[year_month] += 1 : bar_data_as_object[year_month] = 1;  // add the mass bunk lectures
          }

        }
        // converting object to arrays for line graph
        var line_x = Object.keys(line_data_as_object)
        var line_y = Object.values(line_data_as_object)
        // converting object to arrays for bar graph
        var bar_x = Object.keys(bar_data_as_object)
        var bar_y = Object.values(bar_data_as_object)
        // show maximum last 8 months of data for line graph
        line_x = line_x.slice(-8);
        line_y = line_y.slice(-8);
        // show maximum last 8 months of data for bar graph
        bar_x = bar_x.slice(-8);
        bar_y = bar_y.slice(-8);
        res.render('dashboard/teacher-dashboard', {
          user: req.user,
          classrooms: classes,
          totClass: totalClasses,
          totStu: totalStudents,
          totLec: totalLectures,
          avgPercent: avgPercent,
          topAttPerStuPerClass: topAttPerStuPerClass,
          totClassAttStats: totClassAttStats,
          line_x: JSON.stringify(line_x),
          line_y: line_y,
          bar_x: JSON.stringify(bar_x),
          bar_y: bar_y,
        });

      })
    })
  }
});

//Get student profile
router.get('/profile', isLoggedIn, function (req, res, next) {
  if (req.user.who == "1") {
    var obj = api.studentAttendance(req.user.id)
    obj.then(attendance => {
      res.render('user/profile', {
        user: req.user,
        attendance: attendance
      });
    })
  }
  else if (req.user.who == "0") {
    res.render('user/teacher-profile', {
      user: req.user,
    });
  }
});

//Get classrooms of a student
router.get('/userClasses', isLoggedIn, function (req, res, next) {
  calc()
  if (req.user.who == "1") {
    var obj = api.forUserClasses(req.user._id)
    obj.then(ob => {

      for (i = 0; i < ob.classes.length; i++) {
        var classroom = ob.classes[i]
        for (j = 0; j < classroom.studentDetails.length; j++) {
          var student = classroom.studentDetails[j]
          if (student.name == req.user.name) {
            ob.classes[i].studentDetails = student
            break
          }
        }
      }
      console.log(ob.classes[0])
      res.render('classroom/user-classes', {
        user: req.user,
        totClass: totalClasses,
        classrooms: ob.classes,
        attendance: ob.attendance,
        totLec: ob.totalLecs,
        totStuClass: ob.classes.length,
      });
    })
  }
});

/*Get defaulter classes for a student*/
router.get('/defaulterClasses', isLoggedIn, function (req, res, next) {
  calc()
  defaultersList = [];
  if (req.user.who == "1") {
    var obj = api.forUserClasses(req.user._id)
    obj.then(ob => {
      for (i = 0; i < ob.classes.length; i++) {
        var classroom = ob.classes[i]
        for (j = 0; j < classroom.studentDetails.length; j++) {
          var student = classroom.studentDetails[j]
          if (student.name == req.user.name) {
            if (parseFloat(student.percent) < 75) {
              defaultersList.push({ className: classroom.name, studentCounts: student.counts, classCounts: classroom.totLec, studentPercent: student.percent.toString() })
            }
          }
        }
      }
      res.render('user/defaulterClasses', {
        defaulterClasses: defaultersList,
      });
    })
  }
});

//Get classrooms of a teacher
router.get('/teacher-classrooms', isLoggedIn, function (req, res, next) {
  calc();
  var obj = api.forTeacherClasses(req.user._id)

  obj.then(classes => {
    var totalLectures = 0
    var totalP = 0;
    for (i = 0; i < classes.length; i++) {
      totalLectures += classes[i].totLec
    }
    for (i = 0; i < classes.length; i++) {
      totalP = totalP + (parseInt(classes[i].totalP))
    }
    if (totalLectures === 0) {
      var avgPercent = 0
    }
    else {
      var avgPercent = (((totalP) / (totalLectures * totalStudents)) * 100).toFixed(2).toString()
    }
    //classes.studentDetails=classes.studentDetails.slice(0,1)
    //console.log(classes.studentDetails)
    res.render('classroom/teacher-classrooms', {
      user: req.user,
      classrooms: classes,
      totClass: totalClasses,
      totStu: totalStudents,
      totLec: totalLectures,
      avgPercent: avgPercent
    });
  })

});

//Get classroom details
router.get('/class-details/:id', isLoggedIn, function (req, res, next) {
  calc()
  api.creatXl(req.params.id)
  var obj = api.forClassDeatils(req.params.id)
  obj.then((ob) => {
    //console.log(ob)
    res.render('classroom/classDetails', {
      user: req.user,
      classroom: ob.classroom,
      students: ob.stuArray,
      totClass: totalClasses,
      totStu: ob.stuArray.length,
      totP: ob.totalPercent
    });
  })
});

//Take attendance of students in class
router.get('/take_attendance/:id', function (req, res, next) {
  var url = 'http://127.0.0.1:5000/camera/' + req.user._id.toString()
  request(url, function (error, response, body) {
    console.log(body)
  });
  res.render('user/cameraOn');
});

//Add new class
router.get('/create-class', isLoggedIn, (req, res) => {
  console.log(req.user);
  res.render('classroom/create-class');
});
router.post('/create-class', (req, res, next) => {
  var newClass = {
    name: req.body.name,
    description: req.body.description,
    owner: req.user._id,
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

//delete particular class
router.get('/teacher-classroom/delete/:id', async(req, res, next) => {
  var classId = req.params.id;
  classModel.findByIdAndDelete(classId, function (err, deleted) {
    if (err) {
      console.log(err);
    }
    else {
      recordModel.deleteMany({'data.Class':classId.toString()},function(err,attendanceDel){
        if(err){
          console.log(err);
        }
        else{
          console.log("attendaceRecord"+JSON.stringify(attendanceDel));
          res.redirect('/user/teacher-classrooms');
        }
      });
    }
  });
});

//Add new student in particular class
router.get('/class-details/:id/students/new', isLoggedIn, (req, res) => {
  userModel.find({ 'who': "1" }, function (err, users) {
    if (err) {
      return done(err);
    }
    else {
      //console.log(users);
      classModel.findById(req.params.id, function (err, classroom) {
        if (err) {
          return done(err);
        }
        else {
          let notInClassStudents = [];
          users.map((user) => {
            flag = 0
            classroom.students.map((stuId) => {
              if (stuId.equals(user._id)) {
                flag = 1
              }
            });
            if (flag === 0) {
              notInClassStudents.push(user);
            }
          });
          res.render('user/addStudents', {
            users: notInClassStudents,
            classroom: classroom
          });
        }
      });
    }
  });
});
router.get('/class-details/:id/students/new/:stuId', (req, res, next) => {
  var students = req.params.stuId;
  classModel.findOneAndUpdate({ _id: req.params.id }, { $push: { students: students } }, { new: true }, function (err, updatedClass) {
    if (err) {
      console.log(err);
    }
    else {
      res.redirect('/user/class-details/' + req.params.id + '/students/new');
    }
  });
});

//Remove a student from a particular class
router.get('/class-details/:id/students/remove/:stuId', (req, res, next) => {
  var classId = new mongo.ObjectID(req.params.id);
  var students = new mongo.ObjectID(req.params.stuId);
  classModel.findOneAndUpdate({_id:req.params.id} ,{ $pull: {"students":  req.params.stuId } },{ new: true }, function (err, deleted) {
    if (err) {
      console.log(err);
    }
    else {
      res.redirect('/user/class-details/' + req.params.id);
    }
  });
});

/*Conduct a lecture*/
router.get('/add-lec/:id', (req, res, next) => {

  classModel.findOneAndUpdate({ _id: req.params.id }, { $inc: { totLec: 1 } }, function (err, updatedClass) {
    if (err) {
      console.log(err);
    }
    else {
      res.redirect('/user/class-details/' + req.params.id);
    }
  });
});

//Get all registered students
router.get('/allStudents', (req, res, next) => {
  userModel.find({ 'who': "1" }, function (err, users) {
    if (err) {
      return done(err);
    }
    else {
      res.render('user/allStudents', {
        users: users,
      });
    }
  });
});

//Function for logging out 
router.get('/logout', isLoggedIn, function (req, res, next) {
  req.logout();
  res.redirect('/');
});

//Functions for uploading a photo
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + '../../public/assets/uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
});
var upload = multer({ storage: storage });
router.get('/upload', isLoggedIn, (req, res) => {
  var messages = req.flash('error');
  res.render('user/upload', { messages: messages, hasErrors: messages.length > 0 });

});
router.post('/upload', upload.single('photo'), (req, res, next) => {

  var obj = {
    user: req.user,
    img: {
      data: fs.readFileSync(path.join(__dirname + '../../public/assets/uploads/' + req.file.filename)),
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

//Function used for running the routes below if not logged in 
router.use('/', notLoggedIn, function (req, res, next) {
  next();
});

//Functions for logging in 
router.get('/login', function (req, res, next) {
  var messages = req.flash('error');
  res.render('user/login', { messages: messages, hasErrors: messages.length > 0 });
});
router.post('/login', passport.authenticate('local-login', {
  failureRedirect: '/user/login',
  failureFlash: true

}), function (req, res, next) {
  req.session.user = req.user
  if (req.session.oldurl) {
    var oldurl = req.session.oldurl;
    req.session.oldurl = null;
    res.redirect(oldurl);
  } else {
    res.redirect('/user/dashboard');
  }

});

//Fuctions for registering a new student
router.get('/register', function (req, res, next) {
  var messages = req.flash('error');
  if (req.session.filledformdata) {
    var filledformdata = req.session.filledformdata;
    req.session.filledformdata = undefined;
  }
  res.render('user/register', { messages: messages, hasErrors: messages.length > 0, filledformdata: filledformdata });
});
router.post('/register', check, passport.authenticate('local-register', {
  failureRedirect: '/user/register',
  failureFlash: true

}), function (req, res, next) {
  req.session.filledformdata = undefined;
  req.session.user = req.user;
  if (req.session.oldurl) {
    var oldurl = req.session.oldurl;
    req.session.oldurl = null;
    res.redirect(oldurl);
  } else {
    res.redirect('/user/dashboard');
  }

});

//Function for form fields 
function check(req, res, next) {
  var input = {
    'usernameInput': req.body.name,
    'class': req.body.class,
    'rollnumber': req.body.rollnumber,
    'emailInput': req.body.email,
  }
  req.session.filledformdata = input;
  next();
}
//Functions for registering a new teacher
router.get('/teacher-register', function (req, res, next) {
  var messages = req.flash('error');
  if (req.session.filledformdata) {
    var filledformdata = req.session.filledformdata;
    req.session.filledformdata = undefined;
  }
  res.render('user/teacher-register', { messages: messages, hasErrors: messages.length > 0, filledformdata: filledformdata });
});
router.post('/teacher-register', check, passport.authenticate('local-register', {
  failureRedirect: '/user/teacher-register',
  failureFlash: true

}), function (req, res, next) {
  req.session.filledformdata = undefined;
  if (req.session.oldurl) {
    var oldurl = req.session.oldurl;
    req.session.oldurl = null;
    res.redirect(oldurl);
  } else {
    res.redirect('/user/dashboard');
  }

});

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/user/login');
}
function notLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/user/login');
}