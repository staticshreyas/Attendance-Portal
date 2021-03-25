var userModel = require('../models/user');
var classModel = require('../models/class');
var recordModel = require('../models/record');
const mongo = require('mongodb');

const Excel = require('exceljs')

//Function that returns the details of each class
async function forClassDeatils(classId) {

    var classroom = await classModel.findById(classId)

    var studentPromise = classroom.students.map(async (stuId) => {
        var students = await userModel.findById(stuId)
        //console.log(students)
        return students
    });

    var stuArray = await Promise.all(studentPromise)

    var resp = await recordModel.find({ 'data.Class': classId.toString() })

    var response = JSON.parse(JSON.stringify(resp))

    //console.log(stuArray)

    var totalP = 0
    for (i = 0; i < stuArray.length; i++) {
        var k = 0;
        let student = stuArray[i]
        for (j = 0; j < response.length; j++) {
            for (w = 0; w < response[j].data.Name.length; w++) {
                if (student.name == response[j].data.Name[w]) {
                    k++
                }
            }
        }
        totalP += k
        stuArray[i]["counts"] = k.toString()
        if (classroom.totLec == 0)
            stuArray[i]["percent"] = 0
        else
            stuArray[i]["percent"] = ((k / (classroom.totLec)) * 100).toFixed(2).toString()

        classroom.studentDetails = stuArray
    }
    if (classroom.totLec == 0)
        var totalPercent = 0
    else
        var totalPercent = (((totalP) / (classroom.totLec * stuArray.length)) * 100).toFixed(2).toString()


    var obj = { classroom: classroom, stuArray: stuArray, totalPercent: totalPercent, totalP: totalP }

    return obj


}

//Function that returns all the classes of the teacher
async function forTeacherClasses(teacherId) {

    var allClasses = []
    var classrooms = await classModel.find({ 'owner': teacherId })

    for (classes of classrooms) {
        var obj = forClassDeatils(classes._id)
        var ob = await obj
        var classroom = ob.classroom
        var stuArray = ob.stuArray
        classroom.studentDetails = stuArray
        classroom.totalP = ob.totalP
        classroom.totalPercent = ob.totalPercent
        allClasses.push(classroom)
    }

    //console.log(allClasses[0].studentDetails)

    return allClasses
}

//Function that creates a XL file for the face recognition model
async function creatXl(classId) {

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

//Function which calculates the attendance of a student 
async function studentAttendance(stuId) {

    var student = await userModel.findById(stuId)

    var resp = await recordModel.find({ 'data.RollNo': parseInt(student.rollnumber) })
    //console.log(resp)
    if (resp.length > 0) {
        var response = JSON.parse(JSON.stringify(resp))
        var totalStuRecords = resp.length
        var totalStuLecs = 0
        var mark = []
        for (record of response) {
            if (mark.length > 0) {
                var found = false
                for (var i = 0; i < mark.length; i++) {
                    if (mark[i].id == record.data.Class[0]) {
                        found = true
                        break
                    }
                }
                if (found) {
                    continue
                }
                var classId = record.data.Class[0]
                var obj = forClassDeatils(classId)
                var ob = await obj
                var classroom = ob.classroom
                mark.push(classroom)
                //console.log(classroom)
                totalStuLecs += classroom.totLec
            }
            else {
                var classId = record.data.Class[0]
                var obj = forClassDeatils(classId)
                var ob = await obj
                var classroom = ob.classroom
                mark.push(classroom)
                //console.log(classroom)
                totalStuLecs += classroom.totLec
            }
        }
        var attendance = ((totalStuRecords / totalStuLecs) * 100).toFixed(2).toString()
    } else {
        var classes = await classModel.find({ 'students': student._id })
        //console.log(classes)
        if (classes.length == 0) {
            attendance = -1
        }
        else {
            attendance = 0
        }
    }
    return attendance
}

//Function to return the attendance and all the classes he/she is in 
async function forUserClasses(stuId) {

    var allClasses = []
    var student = await userModel.findById(stuId)

    var resp = await recordModel.find({ 'data.RollNo': parseInt(student.rollnumber) })
    if (resp.length > 0) {

        var response = JSON.parse(JSON.stringify(resp))

        var totalStuRecords = resp.length
        var totalStuLecs = 0
        for (record of response) {
            if (allClasses.length > 0) {
                var found = false
                for (var i = 0; i < allClasses.length; i++) {
                    if (allClasses[i].id == record.data.Class[0]) {
                        found = true
                        break
                    }
                }
                if (found) {
                    continue
                }
                var classId = record.data.Class[0]
                //console.log(classId)
                var obj = forClassDeatils(classId)
                var ob = await obj
                var classroom = ob.classroom
                var owner = await userModel.find({ '_id': classroom.owner })
                classroom['teacher'] = owner[0].name
                allClasses.push(classroom)
                totalStuLecs += classroom.totLec
            }
            else {
                var classId = record.data.Class[0]
                var obj = forClassDeatils(classId)
                var ob = await obj
                var classroom = ob.classroom
                var owner = await userModel.find({ '_id': classroom.owner })
                classroom['teacher'] = owner[0].name
                allClasses.push(classroom)
                totalStuLecs += classroom.totLec
            }

        }
        var attendance = ((totalStuRecords / totalStuLecs) * 100).toFixed(2).toString()
    } else {
        var classes = await classModel.find({ 'students': student._id })
        if (classes.length == 0) {
            totalStuRecords = 0
            attendance = -1
        }
        else {
            totalStuRecords = 0
            attendance = 0
            for (var i = 0; i < classes.length; i++) {
                var classId = classes[i]._id
                var obj = forClassDeatils(classId)
                var ob = await obj
                var classroom = ob.classroom
                var owner = await userModel.find({ '_id': classroom.owner })
                classroom['teacher'] = owner[0].name
                allClasses.push(classroom)
            }
        }
    }
    var obj = { attendance: attendance, classes: allClasses, totalLecs: totalStuRecords }

    return obj

}

// Function to get all lectures taken by the teacher
async function allLecTeacher(ownerId) {
    var resp = await recordModel.find({ 'owner': ownerId.toString() }); // get all attendance for this teacher
    return resp;
}

async function removeStudent(classId, studentId) {

    var students = await userModel.findById(studentId);
    var student = JSON.parse(JSON.stringify(students))

    var name = student.name;

    //var records = await recordModel.deleteMany({ "data.Name": name })

    var del = await classModel.findOneAndUpdate({ _id: classId }, { $pull: { "students": studentId } }, { new: true })

}

module.exports = { forClassDeatils, forTeacherClasses, creatXl, studentAttendance, forUserClasses, allLecTeacher, removeStudent }