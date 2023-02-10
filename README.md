<div align="center">
 
![INTRO](./images/captureGIF.gif)

<h1 align="center">Capture It!</h1>

[![](https://img.shields.io/badge/Made_with-Nodejs-red?style=for-the-badge&logo=node.js)](https://nodejs.org/en/)
[![](https://img.shields.io/badge/IDE-Visual_Studio_Code-purple?style=for-the-badge&logo=visual-studio-code)](https://code.visualstudio.com/  "Visual Studio Code")
[![](https://img.shields.io/badge/Database-MongoDB-green?style=for-the-badge&logo=mongodb)](mongodb.com "MongoDB")
[![](https://img.shields.io/badge/Made_with-Python-blue?style=for-the-badge&logo=python)](https://www.python.org/)

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]

</div>

<p align="center">
  <p align="center">
    <br />
    <a href="https://github.com/staticshreyas/Attendance-Portal">View Demo</a>
    ·
    <a href="https://github.com/staticshreyas/Attendance-Portal/issues">Report Bug</a>
    ·
    <a href="https://github.com/staticshreyas/Attendance-Portal/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
     
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

We have developed a cutting-edge attendance recorder which records attendance of the students using our face recognition model which has an accuracy of about 97%.  Using face recognition, you can easily record attendance and have access to in-depth analysis and a wide range of functionalities. Because of the covid-19 pandemic, stringent guidelines have been established, and precautions must be made to minimise unnecessary physical encounters. As a result, our method has shown to be effective in eliminating the requirement for any type of physical interaction while collecting and analysing attendance.

Detailed explanation of the project is given below.

You can view our research paper - [CaptureIt! - A Web-based Attendance System Using Face Recognition](https://ieeexplore.ieee.org/document/9597350)


### Built With

* [NodeJS](https://nodejs.org/en/)
* [ExpressJS](https://expressjs.com/en/starter/generator.html)
* [Python](https://www.python.org/)
* [OpenCV](https://opencv.org/)

<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

Update to the latest version of npm
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/staticshreyas/Attendance-Portal.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Install Python packages
   
   ```sh
   cd ./Py-Scripts 
   pip install requirements.txt
   ```

### Running the project
1. Start the express server from the root directory
   ```sh
   npm start
   ```
2. Start the flask server
    ```sh
    cd ./Py-Scripts
      python app.py
   ```
3. Start the mongo server
    ```sh
    mongod --dbpath YOUR_PATH
   ```

<!-- USAGE  -->
## Usage


#### **Home Page**: Lets take a dive into our portal!

![product-home](./images/home.png)

#### **Steps for registration of a student**: 

1. Verify your email 
   
   - 6 digit OTP is sent to the entered email
  
     ![product](./images/otpSuccess.png)

     ![product-otpMail](./images/otpMail.png)

(**Note:** Only college domain emails accepted)

![product-home](./images/emailFail.png)

2.  Fill the registration form
    
     ![product-otpMail](./images/formStudent.png)



(**Note:** Cannot create account for an existing roll number)

![product-home](./images/rollFail.png)

(**Note:** Password must satisfy specified conditions)

![product-home](./images/formStuFail.png)

3. Logging in student's account for the first time
   
   - Classrooms page
  
     ![product](./images/firstLoginClassrooms.png)

   - Profile page
  
     ![product](./images/firstLoginProfile.png)

   - Defaulter page
  
     ![product](./images/firstLoginDefaulter.png)

#### **Steps for registration of a teacher**: 

1. Verify your email 
   
   - 6 digit OTP is sent to the entered email
  
     ![product](./images/teacherOtp.png)

(**Note:** Only college domain emails accepted as mentioned above)

2.  Fill the registration form
    
     ![product-otpMail](./images/teacherForm.png)


(**Note:** Password must satisfy specified conditions)

![product-home](./images/teacherFormFail.png)

3. Logging in teacher's account for the first time
   
   - Dashboard page
  
     ![product](./images/teacherFirstDashboard.png)

   - Classroom page
  
     ![product](./images/teacherFirstClass.png)

   - Defaulter page
  
     ![product](./images/teacherFirstDefaulter.png)


#### **Steps for creating a new classroom**: 

1. Create a new classroom
  
   - Click "Create new classroom" on the classrooms page
   
     ![product](./images/createClassButton.png)
    - Fill the following form 
  
      ![product](./images/classCreateForm.png)

2. View details
  
   - Click "See all" button of a particular classroom on the classrooms page 
   
     ![product](./images/classDetailsButton.png)

   - Class details page after creating a new class
  
     ![product](./images/firstClassDetails.png)

#### **Steps for manually adding a student to a new classroom**: 

1. Add students directly 

   - Click "Add students" on the class details page
   
     ![product](./images/addStudentButton.png)

    - Add any student by clicking on "+" to add a student to the class
  
      ![product](./images/plusStudentButton.png) 

    - After adding a student classrooms page
  
      ![product](./images/classroomsAfterStudAdd.png) 

    - After adding a student class details page
  
      ![product](./images/classDetailsAfterStuAdd.png) 

    - Get an email notification when you are added to a class

      ![product](./images/newClassEmailNotif.png) 


2. Add students using filter 

   - Click "Filters" on the Add Students page
   
     ![product](./images/addStuFiltersButton.png)

    - Select any filter/filters
  
      ![product](./images/addStuFilters.png) 

    - Add any student by clicking on "+" to add a student to the class
  
      ![product](./images/filteredStudents.png) 

3. Add all students at once

   - Click "Add all" button on the Add Students page (You can add all filtered students as well)
   
     ![product](./images/addAllStu.png)

#### **Steps for joining a classroom with an unique code:** 

1. Copy code
   
   - Copy and send the unique code displayed on the class details page to students using your preferred choice of communication
  
     ![product](./images/copyCode.png)

2. Enter received code to join a classroom
   
   - A student will receive a code from the teacher. Using this code he can join that particular classroom by entering the code in the box displayed below

     ![product](./images/enterCodeButton.png)
    
    - Entering wrong code
  
     ![product](./images/joinCodeFail.png)

    - Entering correct code
  
     ![product](./images/joinCodeSuccess.png)

    - Entering code of a class, of which you are already a part
  
     ![product](./images/joinCodeAlreadyPart.png)
  
#### **Steps for uploading a picture for face recognition:** 

**Note:** This photo will also be set as a default profile picture of your account!!

1. Upload image form

   - Open the upload image tab in the student's portal

     ![product](./images/uploadImageForm.png)

   - Select an image in whoch your face is clearly visible (**Note:** Only jpg format is accepted and your image must have the filename as follows 'rollnumber.jpg')
  
    - The image below is blurred for privacy.

     ![product](./images/uploadImage.png)

2. After uploading your image

   - Classrooms page
  
     ![product](./images/afterUploadClasses.png)

   - Profile page
  
     ![product](./images/afterUploadProfile.png)
    

#### **Steps for recording attendance:** 

Log in to your teacher's account.

1. Conduct a lecture

    - Click the "Conduct Lecture" button in the class details to conduct a lecture
  
     ![product](./images/conductButton.png)


    - After conducting a lecture the lecture number increases as highlighted below. After this step the teacher can start recording the attendance
  
     ![product](./images/afterConduct.png)

2. Record attendance
  

    - Click the "Take attendance" button in the class details to start the camera and record the attendance
  
     ![product](./images/takeAttendanceButton.png)


    - A window will open and a camera will start to record the attendance. You can press q to exit the recording frame once you are done recording the attendance
  
    ![product](./images/cameraStart.png)

    - A notification bell sound will be heard once a student is recognised and his/her name will be displayed in the frame as shown below

    ![product](./images/recorder.png)

**Note:** Our app supports multiple face detection in a single frame as well.

*To record a mass bunk you need to conduct a lecture by clicking on the above mentioned button, and then start the attendance recorder by clicking on the "Take Attendance" button and then close the camera by pressing "q" on the keyboard. This will be recorded as mass bunk as no students will be present to mark their attendance.*

#### **Statistics based on attendance:** 

1. Dashboard
   
    - Our app calculates numerous statisitics based on the recorded attendance for the teachers to analyse. Below is a screenshot of the dashboard displaying the same.

    ![product](./images/populatedDash.png)

2. Classrooms
   
      - the classroom page displays all the classrooms the teacher has created and displays various stats as displayed below.

        ![product](./images/populatedClassrooms.png)
    
      - You can colour code the classes as well.
      
        ![product](./images/populatedClassroomsColoured.png)

      - The class details page will also display various stats related to the particular classroom

        ![product](./images/classDetailsStats.png)
 
3. Defaulter

   - The teacher can view a list of defaulter students and can also send mail for attendance warning by a click of a single button. (**Note:** You can apply any filter based on the class to sort the students as shown below)

    ![product](./images/defaulterSorted.png)

   - By clicking the send mail button an email is sent to the students as displayed below

    ![product](./images/defaulterMail.png)

4. Student Portal

   - Students can view all the classrooms they are a part of, and view their individual attendance in each of the classes.

    ![product](./images/studentClass.png)

    - Students can view the classes in which they have attendance less than 75%
    
    ![product](./images/defaulterStuClass.png)

    - Profile of the student will also show whether they have optimal overall attendance

    ![product](./images/profileAttend.png)

5. Update Details

    #### **Update Profile picture**

    - Click on the profile photo to open the form. A modal will appear and then you can select the photo of your choice.

    ![product](./images/updateProfile1.png)

    ![product](./images/updateProfile2.png)

    - Once the photo is updated, you will be notified and the change will reflect on your profile.

    ![product](./images/updateProfile3.PNG)

    #### **Update Profile details**

    - Click on the settings button to open the form. A modal will appear and then you can change the details of your choice

    ![product](./images/updateStudentDetails1.png)

    ![product](./images/updateStudentDetails2.PNG)

    - After submitting the form, the profile will be updated.

    ![product](./images/updateStudentDetails3.PNG)

    #### **Update Class details**

    - Click on the settings button of the required class to open the form. A modal will appear and then you can change the class details of your choice

    ![product](./images/updateClassDetails1.png)

    - After submitting the form, the class details will be updated.

    ![product](./images/updateClassDetails2.png)


    

#### **Exporting to XLSX:** 

1. Attendance export
  
    - You can export the attendance to .xlsx file by clicking on the "Download Attendance button" on the sidenav.
   

    - After the download has completed, you can access the xlsx file in your downloads folder on your local computer
  
      ![product](./images/downloadedAttend.png)

2. Absentees export

   - Open the form for entering a date by clicking on the "Absent Students" button on the sidenav
  
    - You can select a particular date to find out the people who were absent on that day along with the class name which they didnt attend. If there was a mass bunk it will be displayed as "Mass Bunk".

      ![product](./images/selectDate.png)
    
    - After selecting the date you can view the absentees
  
      ![product](./images/viewAbsentees.png)

    - You can export the absentees to xlsx file and download it on your local computer by clicking on the "Download XlS File"
  
      ![product](./images/absentees.png)

#### **Connect Android Device Camera:**

Setup : <br>
Step 1 : Install "IP Webcam" APP from playstore <br>
Step 2 (optional) : Go to Video preferences and select Main Camera as Front camera 

To Run : **(Both Devices should be connected to same Network)** <br>
Step 1 : Click on Start server <br>
Step 2 : Get the IPv4 address(shown on android screen). eg- 127.123.0.105:8000 <br>
Step 3 : Enter the addess in "Connect Android" Input Field.<br>
Step 4 : Click Take Attendance

![product](./images/connect_android_filled.PNG)



#### **Star Us : Footer** 
![product](./images/footer_open.PNG)


<!-- LICENSE -->

## License

Distributed under the GPL - 3.0 License. 



<!-- CONTACT -->
## Contact the developers

Shreyas  - shreyas.mm@somaiya.edu

Sakshi - shelar.sa@somaiya.edu

Akshit - akshit.gs@somaiya.edu





<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements

* [Creative Tim](https://www.creative-tim.com/)







[contributors-shield]: https://img.shields.io/github/contributors/staticshreyas/Attendance-Portal.svg?style=for-the-badge
[contributors-url]: https://github.com/staticshreyas/Attendance-Portal/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/staticshreyas/Attendance-Portal.svg?style=for-the-badge
[forks-url]: https://github.com/staticshreyas/Attendance-Portal/network/members
[stars-shield]: https://img.shields.io/github/stars/staticshreyas/Attendance-Portal.svg?style=for-the-badge
[stars-url]: https://github.com/staticshreyas/Attendance-Portal/stargazers
[issues-shield]: https://img.shields.io/github/issues/staticshreyas/Attendance-Portal.svg?style=for-the-badge
[issues-url]: https://github.com/staticshreyas/Attendance-Portal/issues
[license-shield]:https://img.shields.io/github/license/staticshreyas/Attendance-Portal.svg?style=for-the-badge
[license-url]: https://github.com/staticshreyas/Attendance-Portal/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/staticshreyas
