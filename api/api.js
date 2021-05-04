var userModel = require('../models/user');
var classModel = require('../models/class');
var recordModel = require('../models/record');
var fs = require('fs')

const Excel = require('exceljs');
const record = require('../models/record');

//Function that returns the details of each class
async function forClassDeatils(classId) {

    var classroom = await classModel.findById(classId)

    var studentPromise = classroom.students.map(async (stuId) => {
        var students = await userModel.findById(stuId)
        //console.log(students)
        return students
    });

    var stuArray = await Promise.all(studentPromise)
    stuArray.sort(dynamicSort("rollnumber"));

    var resp = await recordModel.find({ 'data.Class': classId.toString() })

    var response = JSON.parse(JSON.stringify(resp))
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

function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

//students of a teacher i.e part of aleast one class
async function myClassStudents(classes, teacherId) {

    var classrooms = classes;
    var users = await userModel.find({ 'who': "1" });

    //let notInMyClassStudents = [];
    let InMyClassStudents = [];
    for (classroom of classrooms) {
        users.map((user) => {
            classroom.students.map((stuId) => {
                if (stuId.equals(user._id)) {
                    flag = 0
                    for (myStudent of InMyClassStudents) {
                        if (myStudent._id.equals(stuId)) {
                            flag = 1
                            break;
                        }
                    }
                    if (flag == 0) {
                        InMyClassStudents.push(user);
                    }
                }
            });
        });
    }
    InMyClassStudents.sort(dynamicSort("rollnumber"));
    //console.log(InMyClassStudents)
    return InMyClassStudents;
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

    var data = await classModel.findById({ _id: classId })
    //console.log(data)
    var l = data.students.length
    var stu = data.students

    for (i = 0; i < l; i++) {
        var a = stu[i]
        var student = await userModel.findById(a)
        var obj = {}
        obj["name"] = student.name
        obj["image"] = student.rollnumber + ".jpg"
        obj["roll_no"] = student.rollnumber
        obj["classid"] = JSON.parse(JSON.stringify(data._id))

        worksheet.addRow(obj)
        workbook.xlsx.writeFile('./Py-Scripts/students/students_db.xlsx')
    }
}

//Function that creates a XL file for the attendance 
async function createXlAttSheet(classes, response, owner,counter) {

    let workbook = new Excel.Workbook()

    let worksheet = workbook.addWorksheet('attendance_sheet')

    var columns = [
        { header: 'SrNo', key: 'SrNo' },
        { header: 'Rollno', key: 'Rollno', width: 10 },
        { header: 'Name', key: 'Name', width: 15 },
    ]
    for (i = 0; i < classes.length; i++) {
        columns.push({ header: classes[i].name, key: classes[i].name, width: 15 })
    }
    colSize = columns.length;
    worksheet.columns = columns
    var users = await myClassStudents(classes, classes[0].owner);

    for (k = 0; k < users.length; k++) {
        var obj = forUserClasses(users[k]._id)
        await obj.then(ob => {
            for (i = 0; i < ob.classes.length; i++) {
                var classroom = ob.classes[i]
                for (j = 0; j < classroom.studentDetails.length; j++) {
                    var student = classroom.studentDetails[j]
                    if (student.name == users[k].name) {
                        ob.classes[i].studentDetails = student
                        break
                    }
                }
            }
            var object = {}
            object["SrNo"] = k + 1
            object["Rollno"] = users[k].rollnumber
            object["Name"] = users[k].name
            for (z = 0; z < ob.classes.length; z++) {
                var classroom = ob.classes[z]
                object[classroom.name] = classroom.studentDetails.percent
            }
            worksheet.addRow(object);

            for (var i = 1; i < colSize; i++) {
                worksheet.getRow(1).getCell(i).border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
            };
            const row = worksheet.getRow(k + 2);
            for (classroom of classes) {
                cellVal = row.getCell(classroom.name).value
                if (cellVal == null) {
                    row.getCell(classroom.name).value = "Not a part of class"
                    row.getCell(classroom.name).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    row.getCell(classroom.name).font = {
                        name: 'Arial',
                        family: 2,
                        size: 10,
                    };
                }
                else {
                    if (cellVal <= 35)
                        row.getCell(classroom.name).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF73131' },
                        };

                    else if (cellVal <= 50)
                        row.getCell(classroom.name).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFF8C00' },
                        };
                    else if (cellVal <= 75)
                        row.getCell(classroom.name).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFCEA28' },
                        };
                }
            }
        });

        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
            row.eachCell(function (cell, colNumber) {
                cell.font = {
                    name: 'Arial',
                    family: 2,
                    bold: false,
                    size: 10,
                };
                cell.alignment = {
                    vertical: 'middle', horizontal: 'center'
                };
                if (rowNumber == 1) {
                    row.height = 20;
                    cell.font = {
                        bold: true,
                        size: 12
                    };
                }
                else {
                    for (var i = 1; i < colSize + 1; i++) {
                        row.getCell(i).border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    }
                }
            });
        });
    }
    let today = new Date().toDateString();
    var filename = "./XLS_FILES/attendance_sheet/attendance_sheet - " + today + " - " + owner +"("+counter+")" + ".xlsx";
    console.log(filename)
    if (fs.existsSync(filename)) {
        counter=counter+1
         var filename = "./XLS_FILES/attendance_sheet/attendance_sheet - " + today + " - " + owner +"("+counter+")" + ".xlsx";
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader("Content-Disposition", "attachment; filename=" + filename);
        await workbook.xlsx.writeFile(filename);
        return 1
    } else {
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader("Content-Disposition", "attachment; filename=" + filename);
        await workbook.xlsx.writeFile(filename);
        return 0
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
        for (var record of response) {
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
        for (var record of response) {
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

async function getOwner(id) {
    var owner = await userModel.find({ '_id': id })
    var obj = { name: owner[0].name }
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
    var del = await classModel.findOneAndUpdate({ _id: classId }, { $pull: { "students": studentId } }, { new: true })

}

async function removeAllStudent(studentId) {

    var students = await userModel.findById(studentId);
    var student = JSON.parse(JSON.stringify(students))
    console.log(student)
    var roll=student.rollnumber
    var name = student.name;
    var del = await classModel.update({},{ $pull: { "students": studentId } }, { new: true })
    var delRecords= await recordModel.update({},{$pull: {"data.Name": name, "data.RollNo":roll}}, { new: true })
    var delStudent= await userModel.findByIdAndDelete(studentId)

}

//function to check if student is already a part of class or if class with that code exists
async function forJoinClass(classCode, user) {
    var classroom = await classModel.findOne({ classCode: classCode })
    let flag = 0
    if (classroom) {
        classroom.students.map((stuId) => {
            if (stuId.equals(user._id)) {
                flag = 1
            }
        });
    }
    else {
        flag = 2
    }
    return flag
}

async function compare(query) {

    var records = await recordModel.find({ 'AttendanceRecord': { "$regex": query, "$options": "i" } })
    var response = JSON.parse(JSON.stringify(records))
    var absentees = []

    for (var record of response) {
        var classID = record.data.Class[0]
        var studentPresent = record.data.Name


        var obj = forClassDeatils(String(classID))
        var data = await obj
        //console.log(data.classroom.name)

        var students = data.stuArray
        var studentName = []

        for (j = 0; j < students.length; j++) {
            studentName.push(students[j].name)
        }

        var a = findDeselectedItem(studentName, studentPresent)
        //console.log(a)
        var b = []
        var c = []
        for (j = 0; j < students.length; j++) {
            var stu = students[j]
            for (z = 0; z < a.length; z++) {
                if (a[z] == stu.name) {
                    b.push(stu.rollnumber)
                    c.push(stu.email)
                    break
                }
            }
        }
        if (a.length == 0) {
            continue
        }
        if (a.length == studentName.length) {
            var ob = { 'class': data.classroom.name, 'absentees': ['Mass Bunk'], 'email': '-', 'rollnumber': '-', "date": query }
            absentees.push(ob)
        }

        else {
            var ob = { 'class': data.classroom.name, 'absentees': a, 'email': c, 'rollnumber': b, "date": query }
            absentees.push(ob)
        }

    }
    //absentees.sort(dynamicSort("rollnumber"));
    return absentees
}

function findDeselectedItem(a1, a2) {

    var absent = a1.filter(e => !a2.includes(e));
    return absent
}

async function downloadXL(data, response,counterAb) {

    let workbook = new Excel.Workbook()
    let worksheet = workbook.addWorksheet('students_db')

    worksheet.columns = [
        { header: 'Name', key: 'name', width: 15 },
        { header: 'Roll', key: 'roll', width: 12 },
        { header: 'Class', key: 'class', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Email', key: 'email', width: 30 }
    ]
    var l = data.length


    for (i = 0; i < l; i++) {
        var students = data[i].absentees
        var email = data[i].email
        var rollnumber = data[i].rollnumber
        for (j = 0; j < students.length; j++) {
            var obj = {}
            obj["name"] = students[j]
            obj["roll"] = String(rollnumber[j])
            obj["class"] = data[i].class
            obj["date"] = data[i].date
            obj["email"] = String(email[j])
            //console.log(obj)
            worksheet.addRow(obj)

        }
    }

    worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
        row.eachCell(function (cell, colNumber) {
            cell.font = {
                name: 'Arial',
                family: 2,
                bold: false,
                size: 10,
            };
            cell.alignment = {
                vertical: 'middle', horizontal: 'center'
            };
            if (rowNumber == 1) {
                row.height = 20;
                cell.font = {
                    bold: true,
                    size: 12
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
            else {
                for (var i = 1; i < colNumber + 1; i++) {
                    row.getCell(i).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            }
        });
    });
    var filename = "./XLS_FILES/absent/absent-" + data[0].date + "("+counterAb+")" + ".xlsx"
    if (fs.existsSync(filename)) {
        counterAb=counterAb+1
        var filename = "./XLS_FILES/absent/absent-" + data[0].date + "("+counterAb+")" + ".xlsx"
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader("Content-Disposition", "attachment; filename=" + filename);
        await workbook.xlsx.writeFile(filename)
        return 1
    }
    else {
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        response.setHeader("Content-Disposition", "attachment; filename=" + filename);
        await workbook.xlsx.writeFile(filename)
        return 0;
    }
}

async function updatestudent(editedUser, id) {
    await userModel.updateOne({ '_id': id }, editedUser)
}
module.exports = { dynamicSort, forClassDeatils, forTeacherClasses, creatXl, createXlAttSheet, studentAttendance, forUserClasses, allLecTeacher, removeStudent, forJoinClass, getOwner, compare, downloadXL, updatestudent, removeAllStudent }