var express = require('express');
var router = express.Router();
var passport = require('passport');
var userModel = require('../models/user');
var imgModel = require('../models/image');
var classModel = require('../models/class');
var recordModel = require('../models/record');
var multer = require('multer');



const Excel = require('exceljs')
var fs = require('fs');
var path = require('path');



const request = require('request');
const { basename } = require('path');
const { response } = require('express');

let totalClasses = 0
let totalStudents = 0

function calc() {
  classModel.count({}, function (err, count) {
    totalClasses = count
  })
  userModel.count({ who: "1" }, function (err, count) {
    totalStudents = count
  })
}

async function forClassDeatils(classId) {

  var classroom= await classModel.findById(classId)

  //console.log(classroom._id)
  //console.log(classId)

  var studentPromise=classroom.students.map(async (stuId) => {
    var students= await userModel.findById(stuId)
    return students 
  });

  var stuArray=await Promise.all(studentPromise)

  var resp=await recordModel.find({ 'data.Class': classId.toString() })

  var response = JSON.parse(JSON.stringify(resp))

  //console.log(stuArray)

  var totalP = 0
  for (i = 0; i < stuArray.length; i++) {
    var k = 0;
    let student = stuArray[i]
    for (j = 0; j < response.length; j++) {
      for(w=0;w<response[j].data.Name.length;w++){
        if (student.name == response[j].data.Name[w]) {
        k++
        }
      }
    }
    totalP += k 
    stuArray[i]["counts"] = k.toString()
    if(classroom.totLec==0)
      stuArray[i]["percent"]=0
    else
      stuArray[i]["percent"] = ((k / (classroom.totLec)) * 100).toFixed(2).toString()
    
    classroom.studentDetails=stuArray 
  }
  if(classroom.totLec==0)
    var totalPercent=0 
  else
    var totalPercent = (((totalP) / (classroom.totLec*stuArray.length)) * 100).toFixed(2).toString()
  

  var obj=  {classroom: classroom, stuArray: stuArray, totalPercent: totalPercent, totalP: totalP}

  return obj


}

async function forTeacherClasses(teacherId){

  var allClasses=[]
  var classrooms= await classModel.find({ 'owner': teacherId })

  for(classes of classrooms){
    var obj=forClassDeatils(classes._id)
    var ob = await obj
    var classroom=ob.classroom
    var stuArray=ob.stuArray
    classroom.studentDetails=stuArray
    classroom.totalP=ob.totalP
    classroom.totalPercent=ob.totalPercent
    allClasses.push(classroom)
  }

  //console.log(allClasses[0].studentDetails)

  return allClasses
}

async function creatXl(classId){

  let workbook = new Excel.Workbook()
  let worksheet = workbook.addWorksheet('students_db')

  worksheet.columns = [
    { header: 'name', key: 'name' },
    { header: 'image', key: 'image' },
    { header: 'roll_no', key: 'roll_no' },
    { header: 'classid', key: 'classid' }
  ]

  var data = await classModel.find({ _id: classId }).select({ "students": 1, "_id": 1 })

  for (i = 0; i < data[0].students.length; i++) {
        var a = data[0].students[i]
        //console.log(a)
        var student = await userModel.findById(a) 
        //console.log(student)
            var obj = {}
            obj["name"] = student.name
            obj["image"] = student.rollnumber + ".jpg"
            obj["roll_no"] = student.rollnumber
            obj["classid"] = data[0].id
            //console.log(obj)

            worksheet.addRow(obj)
            workbook.xlsx.writeFile('./Py-Scripts/students/students_db.xlsx')
  }
}

async function studentAttendance(stuId){

  var student= await userModel.findById(stuId)

  var resp=await recordModel.find({ 'data.RollNo': parseInt(student.rollnumber) })
  if(resp.length>0){
    var response = JSON.parse(JSON.stringify(resp))
    var totalStuRecords=resp.length
    var totalStuLecs=0
    var mark=[]
    for(record of response){
      if(mark.length>0){
        var found=false
        for(var i=0;i<mark.length;i++){
          if(mark[i].id==record.data.Class[0]){
            found=true
            break
          }
        }
        if(found){
          continue
        }
      var classId=record.data.Class[0]
      var obj=forClassDeatils(classId)
      var ob = await obj
      var classroom=ob.classroom
      mark.push(classroom)
      //console.log(classroom)
      totalStuLecs+=classroom.totLec
      }
      else{
      var classId=record.data.Class[0]
      var obj=forClassDeatils(classId)
      var ob = await obj
      var classroom=ob.classroom
      mark.push(classroom)
      //console.log(classroom)
      totalStuLecs+=classroom.totLec
      }
    }
    var attendance=((totalStuRecords/totalStuLecs)*100).toFixed(2).toString()
  }else{
    var classes= await classModel.find({'students': student._id})
    //console.log(classes)
    if(classes.length==0)
    {
      attendance=-1
    }
    else{
    attendance=0
    }
  }
  return attendance
}

async function forUserClasses(stuId){

  var allClasses=[]
  var student= await userModel.findById(stuId)

  var resp=await recordModel.find({ 'data.RollNo': parseInt(student.rollnumber) })
  if(resp.length>0){

    var response = JSON.parse(JSON.stringify(resp))

    var totalStuRecords=resp.length
    var totalStuLecs=0
    for(record of response){
      if(allClasses.length>0){
        var found=false
        for(var i=0;i<allClasses.length;i++){
          if(allClasses[i].id==record.data.Class[0]){
            found=true
            break
          }
        }
        if(found){
          continue
        }
      var classId=record.data.Class[0]
      var obj=forClassDeatils(classId)
      var ob = await obj
      var classroom=ob.classroom
      allClasses.push(classroom)
      totalStuLecs+=classroom.totLec
      }
      else{
      var classId=record.data.Class[0]
      var obj=forClassDeatils(classId)
      var ob = await obj
      var classroom=ob.classroom
      allClasses.push(classroom)
      totalStuLecs+=classroom.totLec
      }

    }

    var attendance=((totalStuRecords/totalStuLecs)*100).toFixed(2).toString()
  }else{
    var classes= await classModel.find({'students': student._id})
    if(classes.length==0)
    {
      totalStuRecords=0
      attendance=-1
    }
    else{
    totalStuRecords=0
    attendance=0
    }
  }
 //console.log(allClasses)
  var obj={attendance: attendance, classes:allClasses,totalLecs: totalStuRecords}

  return obj

}

// function to get all lectures taken by this ownerid-> teacher
async function allLecTeacher(ownerId){
  var resp=await recordModel.find({ 'owner': ownerId.toString() }); // get all attendance for this teacher
  return resp;

}


/*defaulter list*/
router.get('/defaulterStudents', isLoggedIn, function (req, res, next) {
  console.log(req.user.who)
  var obj= forTeacherClasses(req.user._id)
  
  obj.then(classes=>{
    defaultersList=[]
    for(i=0;i<classes.length;i++){
      for(j=0;j<classes[i].studentDetails.length;j++){
        var a=classes[i].studentDetails[j]
        if(parseFloat(a.percent)<75){
          defaultersList.push({studentName:a.name,studentRollno:a.rollnumber,studentEmail:a.email,className:classes[i].name,studentCounts:a.counts,classCounts:classes[i].totLec,studentPercent:a.percent.toString()})
        }
      }
    }
    console.log(defaultersList);

    res.render('user/defaulterStudents', {
      defaulterStudents:defaultersList,
    });
  })
});

/*Get dashboard*/
router.get('/dashboard', isLoggedIn, function (req, res, next) {
  console.log(req.user.who)
  if (req.user.who == "1") {
    res.render('user/dashboard', {
      user: req.user,
    });
  }
  else if (req.user.who == "0") {

    calc();
    var obj= forTeacherClasses(req.user._id)
    var all_lectures_conducted = allLecTeacher(req.user._id) // array of all lectures taken by this teacher
    
    obj.then(classes=>{
      console.log(classes)
      var totalLectures=0
      var totalP=0;
      for(i=0;i<classes.length;i++){
        totalLectures+=classes[i].totLec
      }
      for(i=0;i<classes.length;i++){
        totalP=totalP+(parseInt(classes[i].totalP))
      } 
      if(totalLectures===0){
        var avgPercent=0
      }
      else{
        var avgPercent=(((totalP)/(totalLectures*totalStudents))*100).toFixed(2).toString() 
      }

      totClassAttStats=[]
      for(i=0;i<classes.length;i++){
        var obj={className:classes[i].name,classAttPer:classes[i].totalPercent.toString(),classAttLec:classes[i].totLec}
        totClassAttStats.push(obj)
      }
      //console.log(totClassAttStats)
      
      topAttPerStuPerClass=[]
      for(i=0;i<classes.length;i++){
        max=0
        for(j=0;j<classes[i].studentDetails.length;j++){
          var a=classes[i].studentDetails[j]
          var b=classes[i].studentDetails[max]
          if(parseFloat(a.percent) > parseFloat(b.percent)){
            max=j
          }
        }
        var b=classes[i].studentDetails[max]
        if(parseFloat(b.percent)!=0){
          topAttPerStuPerClass.push({className:classes[i].name,studentName:b.name,studentCounts:b.counts,studentPercent:b.percent.toString()})
        }       
      }

      var graphdata_as_object = {}
      all_lectures_conducted.then(lectures=>{
        
        for(lecture of lectures){
          var time_string = lecture._doc.AttendanceRecord;                      // timestamp of attendance record
          var time_components = time_string.split(" ");                         // day, month, date, time, year
          var year_month =  time_components[4] + ": " + time_components[1];     //merge year + month
          graphdata_as_object[year_month] ? graphdata_as_object[year_month] += 1 : graphdata_as_object[year_month] = 1 ;  //add the lectures
          
        }
        // converting object to arrays for graph
        var bar_x = Object.keys(graphdata_as_object)
        var bar_y = Object.values(graphdata_as_object)
        // show maximum last 8 months of data
        bar_x = bar_x.slice(-8);            
        bar_y = bar_y.slice(-8);
        res.render('user/teacher-dashboard', {
          user: req.user,
          classrooms: classes,
          totClass: totalClasses,
          totStu: totalStudents,
          totLec: totalLectures,
          avgPercent:avgPercent,
          topAttPerStuPerClass:topAttPerStuPerClass,
          totClassAttStats:totClassAttStats,
          bar_x : JSON.stringify(bar_x),
          bar_y : bar_y,
          // bar_graph: bar_data,
        });

      })
    })
  }
});

/*Get profile*/
router.get('/profile', isLoggedIn, function (req, res, next) {
  if (req.user.who == "1") {
    var obj=studentAttendance(req.user.id)
    obj.then(attendance=>{
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

/*Get user classes*/
router.get('/userClasses', isLoggedIn, function (req, res, next) {
  calc()
  if (req.user.who == "1") {
    var obj=forUserClasses(req.user._id)
    obj.then(ob=>{
      
      for(i=0;i<ob.classes.length;i++){
        var classroom=ob.classes[i]
        for(j=0;j<classroom.studentDetails.length;j++){
          var student=classroom.studentDetails[j]
          if(student.name==req.user.name){
            ob.classes[i].studentDetails=student
            break
          }
        }
      }

      res.render('user/user-classes', {
        user: req.user,
        totClass: totalClasses,
        classrooms:ob.classes,
        attendance:ob.attendance,
        totLec: ob.totalLecs,
        totStuClass: ob.classes.length,
      });
    })
  }
});


/* defaulter classes for a student*/
router.get('/defaulterClasses', isLoggedIn, function (req, res, next) {
  calc()
  defaultersList=[];
  if (req.user.who == "1") {
    var obj=forUserClasses(req.user._id)
    obj.then(ob=>{     
      for(i=0;i<ob.classes.length;i++){
        var classroom=ob.classes[i]
        for(j=0;j<classroom.studentDetails.length;j++){
          var student=classroom.studentDetails[j]
          if(student.name==req.user.name){
            if(parseFloat(student.percent)<75){
              defaultersList.push({className:classroom.name,studentCounts:student.counts,classCounts:classroom.totLec,studentPercent:student.percent.toString()})
            }
          }
        }
      }

      res.render('user/defaulterClasses', {
        defaulterClasses:defaultersList,
      });
    })
  }
});



/*Get teacher Classrooms*/
router.get('/teacher-classrooms', isLoggedIn, function (req, res, next) {

  calc();
  var obj= forTeacherClasses(req.user._id)

  obj.then(classes=>{
    var totalLectures=0
    var totalP=0;
    for(i=0;i<classes.length;i++){
      totalLectures+=classes[i].totLec
    }
    for(i=0;i<classes.length;i++){
      totalP=totalP+(parseInt(classes[i].totalP))
    }
    if(totalLectures===0){
      var avgPercent=0
    }
    else{
      var avgPercent=(((totalP)/(totalLectures*totalStudents))*100).toFixed(2).toString() 
    }
    res.render('user/teacher-classrooms', {
      user: req.user,
      classrooms: classes,
      totClass: totalClasses,
      totStu: totalStudents,
      totLec: totalLectures,
      avgPercent:avgPercent
    });
  })

});


/*Get Classroom details*/
router.get('/class-details/:id', isLoggedIn, function (req, res, next) {
  calc()
  creatXl(req.params.id)
  var obj=forClassDeatils(req.params.id)
  obj.then((ob)=>{
    //console.log(ob)
    res.render('user/classDetails', {
      user: req.user,
      classroom: ob.classroom,
      students: ob.stuArray,
      totClass: totalClasses,
      totStu: ob.stuArray.length,
      totP: ob.totalPercent
    });
  })
});


/* Take attendance of students in class*/
router.get('/take_attendance/:id', function (req, res, next) {

  var messages = req.flash('error');
  var url = 'http://127.0.0.1:5000/camera/' + req.user._id.toString()
  console.log("nodeurl :",url);
  request(url, function (error, response, body) {
    console.log(body)
  });
  res.render('user/cameraOn');
});


/* Add new class*/
router.get('/create-class', isLoggedIn, (req, res) => {
  console.log(req.user);
  // var messages= req.flash('error');
  res.render('user/create-class');
});

router.post('/create-class', (req, res, next) => {
  console.log("hereeee");
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


/* Add new student in particular class*/
router.get('/class-details/:id/students/new', isLoggedIn, (req, res) => {
  //console.log(req.params.id);

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
      //console.log(updatedClass);
      res.redirect('/user/class-details/' + req.params.id + '/students/new');
    }
  });
});

router.get('/add-lec/:id', (req, res, next) => {

  classModel.findOneAndUpdate({ _id: req.params.id }, { $inc: { totLec: 1 } }, function (err, updatedClass) {
    if (err) {
      console.log(err);
    }
    else {
      //console.log(updatedClass);
      res.redirect('/user/class-details/' + req.params.id);
    }
  });
});


/* View All Registered Students*/
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


router.get('/logout', isLoggedIn, function (req, res, next) {
  req.logout();
  res.redirect('/');
});

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
  res.render('user/upload', {messages: messages, hasErrors: messages.length > 0 });

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


router.use('/', notLoggedIn, function (req, res, next) {
  next();
});

/* GET users listing. */
router.get('/login', function (req, res, next) {
  var messages = req.flash('error');
  res.render('user/login', { messages: messages, hasErrors: messages.length > 0 });
});

router.post('/login', passport.authenticate('local-login', {
  failureRedirect: '/user/login',
  failureFlash: true

}), function (req, res, next) {
  req.session.user=req.user
  if (req.session.oldurl) {
    var oldurl = req.session.oldurl;
    req.session.oldurl = null;
    res.redirect(oldurl);
  } else {
    res.redirect('/user/dashboard');
  }

});

router.get('/register', function (req, res, next) {
  var messages = req.flash('error');
  if(req.session.filledformdata){
    var filledformdata = req.session.filledformdata ;
    req.session.filledformdata = undefined;
  }
  res.render('user/register', { messages: messages, hasErrors: messages.length > 0,filledformdata:filledformdata });
});


router.post('/register',check ,passport.authenticate('local-register', {
  failureRedirect: '/user/register',
  failureFlash: true

}), function (req, res, next) {
  req.session.filledformdata = undefined;
  req.session.user=req.user;
  if (req.session.oldurl) {
    var oldurl = req.session.oldurl;
    req.session.oldurl = null;
    res.redirect(oldurl);
  } else {
    res.redirect('/user/dashboard');
  }

});

function check(req, res, next){
  var input = {
    'usernameInput' : req.body.name,
    'class' : req.body.class,
    'rollnumber' : req.body.rollnumber,
    'emailInput' : req.body.email,
  }
  req.session.filledformdata = input;
  next();
}
router.get('/teacher-register', function (req, res, next) {
  var messages = req.flash('error');
  if(req.session.filledformdata){
    var filledformdata = req.session.filledformdata ;
    req.session.filledformdata = undefined;
  }
  res.render('user/teacher-register', {messages: messages, hasErrors: messages.length > 0, filledformdata: filledformdata });
});


router.post('/teacher-register',check ,passport.authenticate('local-register', {
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