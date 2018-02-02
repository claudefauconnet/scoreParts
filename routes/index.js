var express = require('express');
var router = express.Router();
var scoreSplitter=require( "../bin/scoreSplitter.js")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



router.post('/', function(req, res, next) {
    scoreSplitter.split("aa");
});

module.exports = router;


