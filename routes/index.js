var express = require('express');
var router = express.Router();
var scoreSplitter = require("../bin/scoreSplitter..js");
var fileUpload = require('../bin/fileUpload.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post('/upload', function (req, response) {
    fileUpload.upload(req,"pdfFile", function (error, file) {
        if (error) {
            return processResponse(response, error, result);
        }
        if (!file || !file.path) {
            return processResponse(response, "wrong file", null);
        }
        scoreSplitter.pdfToImages(file.path, function (error, result) {
            processResponse(response, error, result)
        });
    });
});


router.post('/score', function (req, response, next) {


    if (req.body && req.body.listScores) {
        scoreSplitter.listScores(function (error, result) {
            processResponse(response, error, result)
        })

    }
    if (req.body && req.body.split) {
        scoreSplitter.split(req.body.image, function (error, result) {
            processResponse(response, error, result)
        })


    }
    if (req.body && req.body.generatePart) {
        scoreSplitter.generatePart(req.body.pdfName, req.body.part, req.body.zonesStr, function (error, result) {
            processResponse(response, error, result)
        })


    }


});


function processResponse(response, error, result) {
    if (response && !response.finished) {

        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
        response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
        response.setHeader('Access-Control-Allow-Credentials', true); // If needed


        if (error) {
            if (typeof error == "object") {
                error = JSON.stringify(error, null, 2);
            }
            console.log("ERROR !!" + error);
            //  socket.message("ERROR !!" + error);
            response.status(404).send({ERROR: error});

        }
        else if (!result) {
            response.status(404).send("no result");
        } else {

            if (typeof result == "string") {
                resultObj = {result: result};
                //     socket.message(resultObj);
                response.send(JSON.stringify(resultObj));
            }
            else {
                if (result.contentType && result.data) {
                    response.setHeader('Content-type', result.contentType);
                    if (typeof result.data == "object")
                        response.send(JSON.stringify(result.data));
                    else
                        response.send(result.data);
                }
                else {
                    var resultObj = result;
                    // response.send(JSON.stringify(resultObj));
                    response.send(resultObj);
                }
            }
        }


    }


}


module.exports = router;


