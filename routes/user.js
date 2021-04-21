var express = require('express');
var router = express.Router();
var passport = require('passport');
var userModel = require('../models/user');
var imgModel = require('../models/image');
var classModel = require('../models/class');
var recordModel = require('../models/record');
var multer = require('multer');

const MailSender = require('../mail')

var api = require('../api/api')

var fs = require('fs');
var path = require('path');

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

router.get('/absentFilter', isLoggedIn, function (req, res, next) {
  res.render('user/absentFilter');
});
router.post('/absentFilter', isLoggedIn, function (req, res, next) {
  var reqDate = req.body.date
  var message = ""

  if (reqDate == "Date") {
    message = "Please select a date"
  }
  else {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
    var d = new Date(reqDate);
    var dayName = days[d.getDay()];

    var months = { "01": 'Jan', "02": 'Feb', "03": 'March', "04": 'Apr', "05": 'May', "06": 'Jun', "07": 'Jul', "08": 'Aug', "09": 'Sept', "10": 'Oct', "11": 'Nov', "12": 'Dec' }
    var month = reqDate.slice(0, 2)
    var monthname = months[month]

    var dates = { "01": '1', "02": '2', "03": '3', "04": '4', "05": '5', "06": '6', "07": '7', "08": '8', "09": '9' }
    if (reqDate.slice(3, 5) == "01" || reqDate.slice(3, 5) == "02" || reqDate.slice(3, 5) == "03" || reqDate.slice(3, 5) == "04" || reqDate.slice(3, 5) == "05" || reqDate.slice(3, 5) == "06" || reqDate.slice(3, 5) == "07" || reqDate.slice(3, 5) == "08" || reqDate.slice(3, 5) == "09") {
      var date = dates[reqDate.slice(3, 5)]
    }
    else {
      var date = reqDate.slice(3, 5)
    }

    var query = dayName + " " + monthname + " " + date
    //console.log(query)
    req.session.absentQuery = query
    var ob = api.compare(query)
    ob.then(absentees => {
      //console.log(absentees)
      res.render('user/absentees', { absent: absentees });
    })
  }
  if (message)
    res.render('user/absentFilter', { message: message });
})


router.get('/downloadAbsent', isLoggedIn, function (req, res, next) {
  var query = String(req.session.absentQuery)
  //console.log(query)
  var ob = api.compare(query)
  ob.then(absentees => {
    //console.log(absentees)
    api.downloadXL(absentees,res)
    var filePath = path.join(__dirname +"../../XLS_FILES/absent/absent-" + query + ".xlsx")
    res.download(filePath)
  })
})

//Download attendance sheet of their students for a teacher
router.get('/download-attendance',isLoggedIn,function (req,res,next) {
  var obj = api.forTeacherClasses(req.user._id)
  obj.then((classes)=>{
    ob=api.createXlAttSheet(classes,res)
    ob.then(()=>{
      console.log("Attendance sheet downloaded");
      let today = new Date().toDateString();
      var filePath = "./XLS_FILES/attendance_sheet/attendance_sheet - "+today+".xlsx";    
      res.download(filePath, function(error){
        if(error){
          console.log("Error : ", error)
        }
      });
    });
  }); 
});

router.get('/filter', isLoggedIn, function (req, res, next) {
  res.render('user/filter');
});
router.post('/filter', isLoggedIn, function (req, res, next) {
  var year = req.body.year
  var batch = req.body.batch
  var message = ""
  if (batch == "Batch" && year == "Year") {
    message = "Please select at least one filter"
  }
  else if (batch == "Batch") {
    batch = ""
    userModel.find({ 'year': year }, function (err, users) {
      if (err) {
        return done(err);
      }
      else {
        res.render('user/allStudents', {
          users: users,
          filterActive: true
        });
      }
    });
  }
  else if (year == "Year") {
    year = ""
    userModel.find({ 'class': batch }, function (err, users) {
      if (err) {
        return done(err);
      }
      else {
        res.render('user/allStudents', {
          users: users,
          filterActive: true
        });
      }
    });
  }
  else {
    userModel.find({ 'class': batch, 'year': year }, function (err, users) {
      if (err) {
        return done(err);
      }
      else {
        res.render('user/allStudents', {
          users: users,
          filterActive: true
        });
      }
    });
  }
  if (message)
    res.render('user/filter', { message: message });
})

//Get defaulter list
router.get('/defaulterStudents', isLoggedIn, function (req, res, next) {
  //console.log(req.user.who)
  var obj = api.forTeacherClasses(req.user._id)

  obj.then(classes => {
    defaultersList = []
    for (i = 0; i < classes.length; i++) {
      for (j = 0; j < classes[i].studentDetails.length; j++) {
        var a = classes[i].studentDetails[j]
        if (parseFloat(a.percent) < 75) {
          defaultersList.push({ studentName: a.name, studentRollno: a.rollnumber, studentEmail: a.email, className: classes[i].name, studentCounts: a.counts, classCounts: classes[i].totLec, studentPercent: a.percent.toString(), })
        }
      }
    }
    //console.log(defaultersList);

    res.render('user/defaulterStudents', {
      defaulterStudents: defaultersList,
      classes: classes
    });
  })
});

router.get('/defaulterStudents/filter/:name', isLoggedIn, function (req, res, next) {
  //console.log(req.user.who)
  var obj = api.forTeacherClasses(req.user._id)
  var className = req.params.name
  obj.then(classes => {
    defaultersList = []
    for (i = 0; i < classes.length; i++) {
      for (j = 0; j < classes[i].studentDetails.length; j++) {
        var a = classes[i].studentDetails[j]
        if (parseFloat(a.percent) < 75 && classes[i].name == className) {
          defaultersList.push({ studentName: a.name, studentRollno: a.rollnumber, studentEmail: a.email, className: classes[i].name, studentCounts: a.counts, classCounts: classes[i].totLec, studentPercent: a.percent.toString(), })
        }
      }
    }
    res.render('user/defaulterStudents', {
      defaulterStudents: defaultersList,
      classes: classes,
      filterActive: true,
      activeClassname: className.toString()
    });
  })
});

router.get('/sendDefaulterMail/:name', function (req, res, next) {
  console.log(req.params.name)
  var obj = api.forTeacherClasses(req.user._id)
  var className = req.params.name
  if (className == "all") {
    filterActive = false
  }
  else {
    filterActive = true
  }
  obj.then(classes => {
    defaultersList = []
    for (i = 0; i < classes.length; i++) {
      for (j = 0; j < classes[i].studentDetails.length; j++) {
        var a = classes[i].studentDetails[j]
        if (parseFloat(a.percent) < 75) {
          if (className == "all") {
            console.log("all", a.name, " ", a.email)
            var msg = "<h2>Dear " + a.name + ",</h2>" + " <div style='font-size: 20px'>Your attendance in class <strong>" + classes[i].name + "</strong> is <span style='font-weight:bold;background-color:tomato;'>" + a.percent.toString() + "%</span> which is below the 75% mark.</div>"
            let otp_mail = new MailSender(a.email, "Attendance Warning: ", msg)
            otp_mail.send();
            defaultersList.push({ studentName: a.name, studentRollno: a.rollnumber, studentEmail: a.email, className: classes[i].name, studentCounts: a.counts, classCounts: classes[i].totLec, studentPercent: a.percent.toString(), sent: true, })
          }
          else if (classes[i].name == className) {
            console.log(a.name, " ", a.email)
            var msg = "<h2>Dear " + a.name + ",</h2>" + " <div style='font-size: 20px'>Your attendance in class <strong>" + classes[i].name + "</strong> is <span style='font-weight:bold;background-color:tomato;'>" + a.percent.toString() + "%</span> which is below the 75% mark.</div>"
            let otp_mail = new MailSender(a.email, "Attendance Warning: ", msg)
            otp_mail.send();
            defaultersList.push({ studentName: a.name, studentRollno: a.rollnumber, studentEmail: a.email, className: classes[i].name, studentCounts: a.counts, classCounts: classes[i].totLec, studentPercent: a.percent.toString(), sent: true, })
          }
        }
      }
    }
    res.render('user/defaulterStudents', {
      defaulterStudents: defaultersList,
      classes: classes,
      filterActive: filterActive,
      activeClassname: className.toString(),
    });
  })
})

//Get dashboard
router.get('/dashboard', isLoggedIn, function (req, res, next) {
  //console.log(req.user.who)
  if (req.user.who == "1") {
    calc()
    if (req.user.who == "1") {
      res.redirect('/classroom/userClasses')
    }
  }
  else if (req.user.who == "0") {

    calc();
    var obj = api.forTeacherClasses(req.user._id)
    var all_lectures_conducted = api.allLecTeacher(req.user._id) // array of all lectures taken by this teacher

    obj.then(classes => {
      //console.log(classes)
      var totalC = 0
      var totalP = 0;
      var totalLectures = 0;
      for (i = 0; i < classes.length; i++) {
        totalLectures += classes[i].totLec
      }
      for (i = 0; i < classes.length; i++) {
        totalP = totalP + ((parseInt(classes[i].totalPercent)) / 100)
        if (classes[i].totalPercent)
          totalC++;
      }
      if (totalLectures === 0) {
        var avgPercent = 0
      }
      else {
        var avgPercent = (((totalP) / (totalC)) * 100).toFixed(2).toString()
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
            topAttPerStuPerClass.push({ className: classes[i].name, studentName: b.name, studentCounts: b.counts, classCounts: classes[i].totLec, studentPercent: b.percent.toString() })
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


//classTotAttendPer
router.get('/classTotAttendPer', isLoggedIn, function (req, res, next) {
  calc();
  var obj = api.forTeacherClasses(req.user._id)
  obj.then(classes => {
    totClassAttStats = []
    for (i = 0; i < classes.length; i++) {
      var obj = { className: classes[i].name, classAttPer: classes[i].totalPercent.toString(), classAttLec: classes[i].totLec }
      totClassAttStats.push(obj)
    }
    res.render('user/classTotAttendPer', {
      totClassAttStats: totClassAttStats,
    });
  })
});

//topAttPerStuPerClass
router.get('/topAttPerStuPerClass', isLoggedIn, function (req, res, next) {
  calc();
  var obj = api.forTeacherClasses(req.user._id)
  obj.then(classes => {
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
          topAttPerStuPerClass.push({ className: classes[i].name, studentName: b.name, studentRollno: b.rollnumber, studentEmail: b.email, studentCounts: b.counts, classCounts: classes[i].totLec, studentPercent: b.percent.toString() })
        }
      }
    }
    res.render('user/topAttPerStuPerClass', {
      topAttPerStuPerClass: topAttPerStuPerClass,
    });
  })
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
router.post('/upload', upload.single('photo'), async function (req, res, next) {
  let data = await fs.readFileSync(path.join(__dirname + '../../public/assets/uploads/' + req.file.filename))
  let base64 = data.toString('base64');
  let image = new Buffer(base64, 'base64');
  var obj = {
    user: req.user,
    img: {
      data: image,
      contentType: 'image/png'
    }
  }
  await imgModel.create(obj, (err, item) => {
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

//Fuctions for OTP
router.get('/otp/:role', function (req, res, next) {
  req.session.role = req.params.role
  console.log(req.session.role)
  var messages = req.flash('error');
  res.render('user/otpRegistration', { messages: messages, hasErrors: messages.length > 0 });
});
router.post('/otp/:role', function (req, res, next) {
  var messages = [];
  if (!validateEmail(req.body.email)) {
    messages.push("Email Domain: @somaiya.edu required")
    res.render('user/otpRegistration', { messages: messages, hasErrors: messages.length > 0 });
  }
  else {
    userModel.findOne({ 'email': req.body.email }, function (err, user) {
      if (err) {
        console.log(err)
      }
      if (user) {
        messages.push("Email already in use ! Enter different email id");
        res.render('user/otpRegistration', { messages: messages, hasErrors: messages.length > 0 });
      }
      else {
        messages = req.flash('error');
        var otp = generateOTP();
        req.session.otp = otp
        req.session.verifiedEmail = req.body.email;
        var msg = "<h2>OTP for account verification is </h2>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>"
        let otp_mail = new MailSender(req.body.email, "Otp for registration is: ", msg)
        otp_mail.send();
        res.render('user/otp', { messages: messages, hasErrors: messages.length > 0, verifyEmail: req.body.email })
      }
    });
  }
});

router.post('/verify/:role', function (req, res) {
  var input = {
    'emailInput': req.session.verifiedEmail,
  }
  req.session.filledformdata = input;
  var filledformdata = req.session.filledformdata;
  if (req.body.otp == req.session.otp) {
    console.log(req.session.role)
    if (req.session.role == "student")
      res.render('user/register', { filledformdata: filledformdata });
    else
      res.render('user/teacher-register', { filledformdata: filledformdata });
  }
  else {
    res.render('user/otp', { msg: 'OTP entered is incorrect' });
  }
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

function generateOTP() {
  var otp = Math.random();
  otp = otp * 1000000;
  otp = parseInt(otp);
  console.log(otp);
  return otp
}

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (re.test(email)) {
    if (email.indexOf("@somaiya.edu", email.length - "@somaiya.edu".length) !== -1) {
      return 1
    }
  }
}
