var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {


  res.render('main/index');

});




/* Make student xl file*/
router.get('/db_create', function(req, res, next) {

  const { spawn } = require("child_process");

  const env = spawn('../mip_env/bin/python',['../Py-Scripts/db_maker.py'])

  env.stderr.on( 'data', data => {
    console.log( `stderr: ${data}` );
} );

  env.on("close", code=>{
    console.log(`child process exited with code ${code}`);

    res.render('user/teacher-dashboard', {user: req.user});
  })
});

module.exports = router;
