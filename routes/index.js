var express = require('express');
var router = express.Router();


function testRestfulApi(res){
  var path = require('path');
  var fs = require('fs');

  var readFile = "../public/htmls/test_donator_apis.html";
  var pt = path.join(__dirname, readFile);
  var fileContents = fs.readFileSync(pt);
  res.send(fileContents.toString());
}

function returnRealIndex(res){
  var path = require('path');
  var fs = require('fs');

  var readFile = "../public/htmls/index.html";
  var pt = path.join(__dirname, readFile);
  var fileContents = fs.readFileSync(pt);
  res.send(fileContents.toString());
}

/* GET home page. */
router.get('/', function(req, res, next) {
  //testRestfulApi(res);

  returnRealIndex(res);
});

module.exports = router;
