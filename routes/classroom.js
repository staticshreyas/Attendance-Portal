
var express = require('express');
var router = express.Router();
var userModel = require('../models/user');
var classModel = require('../models/class');
var recordModel = require('../models/record');
const clipboardy = require('clipboardy');
const MailSender = require('../mail')

var api = require('../api/api')

const request = require('request');
const session = require('express-session');

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

//Get classrooms of a student
router.get('/userClasses', isLoggedIn, function (req, res, next) {
    errorMsg=""
    successMsg=""
    if(req.session.errorMsg || req.session.successMsg){
        errorMsg=req.session.errorMsg 
        successMsg=req.session.successMsg
        req.session.errorMsg=undefined
        req.session.successMsg=undefined
    }
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
            res.render('classroom/user-classes', {
                user: req.user,
                totClass: totalClasses,
                classrooms: ob.classes,
                attendance: ob.attendance,
                totLec: ob.totalLecs,
                totStuClass: ob.classes.length,
                errorMsg:errorMsg,
                successMsg:successMsg,
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
            res.render('classroom/defaulterClasses', {
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
    var create = api.creatXl(req.params.id)
    create.then(() => {
    
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
})

});

//Take attendance of students in class
router.get('/take_attendance/:id', function (req, res, next) {
    var url = 'http://127.0.0.1:5000/camera/' + req.user._id.toString()
    request(url, function (error, response, body) {
        //console.log(body)
    });
    res.render('classroom/cameraOn');
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
            res.redirect('/classroom/teacher-classrooms');
        }
    });
});

//copy class code
router.get('/:id/copyCode/:code', isLoggedIn, (req, res) => {
    clipboardy.write(req.params.code);
    res.redirect('/classroom/class-details/' + req.params.id);
});

//student can join class with class code 
router.post('/join-class', (req, res, next) => {
    if(req.session.errorMsg || req.session.successMsg){
        req.session.errorMsg=undefined
        req.session.successMsg=undefined
    }
    userModel.findById(req.user._id, (err, user) => {
        if (err) {
            console.log(err)
        }
        else {
            var obj = api.forJoinClass(req.body.classCode, user)
            obj.then((ob) => {
                if (ob == 1) {
                    req.session.errorMsg="You are already a part of the class!"
                    res.redirect('/classroom/userClasses');
                }
                else if (ob == 0) {
                    classModel.findOneAndUpdate({ classCode: req.body.classCode }, { $push: { students: user._id } }, { new: true }, function (err, updatedClass) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            req.session.successMsg="You are added to new class : "+ updatedClass.name+"!"
                            res.redirect('/classroom/userClasses');
                        }
                    });
                }
                else {
                    req.session.errorMsg="Couldn't join the class.You entered wrong class code!"
                    console.log("You entered wrong class code!")
                    res.redirect('/classroom/userClasses');
                }

            })
        }
    })
});

//Delete particular class
router.get('/teacher-classroom/delete/:id', async (req, res, next) => {
    var classId = req.params.id;
    classModel.findByIdAndDelete(classId, function (err, deleted) {
        if (err) {
            console.log(err);
        }
        else {
            recordModel.deleteMany({ 'data.Class': classId.toString() }, function (err, attendanceDel) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("attendaceRecord" + JSON.stringify(attendanceDel));
                    res.redirect('/classroom/teacher-classrooms');
                }
            });
        }
    });
});

//Add new student in particular class
router.get('/class-details/:id/students/new', isLoggedIn, (req, res) => {
    req.session.classId = req.params.id
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
                    req.session.addStudents=notInClassStudents
                    res.render('classroom/addStudents', {
                        users: notInClassStudents.sort(api.dynamicSort("rollnumber")),
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
            userModel.findById(req.params.stuId, (err, student) => {
                if (err) {
                    console.log(err);
                }
                else {
                    var obj = api.getOwner(updatedClass.owner)
                    obj.then((ob) => {
                        var msg = 'Hey ' + student.name + '! You\'re added to a new class ' + '\'' + updatedClass.name + '\' - ' + updatedClass.description + ' by ' + ob.name
                        //console.log(msg)
                        let class_mail = new MailSender(student.email, 'You\'re added to new class', msg)
                        class_mail.send();
                        res.redirect('/classroom/class-details/' + req.params.id + '/students/new');
                    })

                }
            });
        }
    });
});


router.get('/class-details/:id/students/addAll', (req, res, next) => {
    console.log(req.session.addStudents)
    var studentsArr=req.session.addStudents
    var stuIds=[]
    for(var i=0;i<studentsArr.length;i++){
        stuIds.push(studentsArr[i]._id)
    }
    classModel.findOneAndUpdate({ _id: req.params.id }, { $push: { students:{$each: stuIds }} }, { new: true }, function (err, updatedClass) {
        if (err) {
            console.log(err);
        }
        else {
            var obj = api.getOwner(updatedClass.owner)
            obj.then((ob) => {
                for(var i=0;i<studentsArr.length;i++){
                    var msg = 'Hey ' + studentsArr[i].name + '! You\'re added to a new class ' + '\'' + updatedClass.name + '\' - ' + updatedClass.description + ' by ' + ob.name
                    let class_mail = new MailSender(studentsArr[i].email, 'You\'re added to new class', msg)
                    class_mail.send();
                }
                res.redirect('/classroom/class-details/' + req.params.id + '/students/new');
            })
        }
    });

});

router.get('/addStuFilter', function (req, res, next) {
    res.render('classroom/addStuFilter');
});
router.post('/addStuFilter', function (req, res, next) {
    var year = req.body.year
    var batch = req.body.batch
    var classId = req.session.classId
    var roll = req.body.rollnumber
    var message = ""
    if (batch == "Batch" && year == "Year" && roll == "") {
        message = "Please select at least one filter"
    }
    else if (batch == "Batch" && roll == "") {
        batch = ""
        userModel.find({ 'year': year }, function (err, users) {
            if (err) {
                return done(err);
            }
            else {
                //console.log(users);
                classModel.findById(classId, function (err, classroom) {
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
                        req.session.addStudents=notInClassStudents
                        res.render('classroom/addStudents', {
                            users: notInClassStudents.sort(api.dynamicSort("rollnumber")),
                            classroom: classroom,
                            filterActive: true
                        });
                    }
                });
            }
        });
    }
    else if (year == "Year" && roll == "") {
        year = ""
        userModel.find({ 'class': batch }, function (err, users) {
            if (err) {
                return done(err);
            }
            else {
                //console.log(users);
                classModel.findById(classId, function (err, classroom) {
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
                        req.session.addStudents=notInClassStudents
                        res.render('classroom/addStudents', {
                            users: notInClassStudents.sort(api.dynamicSort("rollnumber")),
                            classroom: classroom,
                            filterActive: true
                        });
                    }
                });
            }
        });
    }
    else if (batch == "Batch" && year == "Year") {
        userModel.find({ 'rollnumber': parseInt(roll) }, function (err, users) {
            if (err) {
                return done(err);
            }
            else {
                //console.log(users);
                classModel.findById(classId, function (err, classroom) {
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
                        req.session.addStudents=notInClassStudents
                        res.render('classroom/addStudents', {
                            users: notInClassStudents.sort(api.dynamicSort("rollnumber")),
                            classroom: classroom,
                            filterActive: true
                        });
                    }
                });
            }
        });
    }
    else if (batch == "Batch") {
        batch = ""
        userModel.find({ 'year': year, 'rollnumber': parseInt(roll) }, function (err, users) {
            if (err) {
                return done(err);
            }
            else {
                //console.log(users);
                classModel.findById(classId, function (err, classroom) {
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
                        req.session.addStudents=notInClassStudents
                        res.render('classroom/addStudents', {
                            users: notInClassStudents.sort(api.dynamicSort("rollnumber")),
                            classroom: classroom,
                            filterActive: true
                        });
                    }
                });
            }
        });
    }
    else if (year == "Year") {
        year = ""
        userModel.find({ 'class': batch, 'rollnumber': parseInt(roll) }, function (err, users) {
            if (err) {
                return done(err);
            }
            else {
                //console.log(users);
                classModel.findById(classId, function (err, classroom) {
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
                        req.session.addStudents=notInClassStudents
                        res.render('classroom/addStudents', {
                            users: notInClassStudents.sort(api.dynamicSort("rollnumber")),
                            classroom: classroom,
                            filterActive: true
                        });
                    }
                });
            }
        });
    }
    else if (roll == "") {
        userModel.find({ 'class': batch, 'year': year }, function (err, users) {
            if (err) {
                return done(err);
            }
            else {
                //console.log(users);
                classModel.findById(classId, function (err, classroom) {
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
                        req.session.addStudents=notInClassStudents
                        res.render('classroom/addStudents', {
                            users: notInClassStudents.sort(api.dynamicSort("rollnumber")),
                            classroom: classroom,
                            filterActive: true
                        });
                    }
                });
            }
        });
    }
    else {
        userModel.find({ 'class': batch, 'year': year, 'rollnumber':parseInt(roll) }, function (err, users) {
            if (err) {
                return done(err);
            }
            else {
                //console.log(users);
                classModel.findById(classId, function (err, classroom) {
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
                        req.session.addStudents=notInClassStudents
                        res.render('classroom/addStudents', {
                            users: notInClassStudents.sort(api.dynamicSort("rollnumber")),
                            classroom: classroom,
                            filterActive: true
                        });
                    }
                });
            }
        });
    }
    if (message)
        res.render('classroom/addStuFilter', { message: message });
})

//Remove a student
router.get('/class-details/:id/students/remove/:stuId', (req, res, next) => {
    var classId = req.params.id;
    var studentId = req.params.stuId;

    var obj = api.removeStudent(classId, studentId)

    obj.then((ob) => {
        res.redirect('/classroom/class-details/' + req.params.id);
    })


});

//Conduct a lecture
router.get('/add-lec/:id', (req, res, next) => {

    classModel.findOneAndUpdate({ _id: req.params.id }, { $inc: { totLec: 1 } }, function (err, updatedClass) {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/classroom/class-details/' + req.params.id);
        }
    });
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/user/login');
}
