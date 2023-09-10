var fs = require('fs');
//var PDFImage = require("pdf-image").PDFImage;
var Jimp = require("jimp");
var async = require('async');
var PDFDocument = require('pdfkit');
var path = require('path');
var execSync = require('child_process').execSync;
var scoreSplitter=require('../bin/scoreSplitter..js')


var pdfSplitter = {

    splitPdf:function(filePath, nPages) {
        scoreSplitter.splitPdf()

    },





}
/*scoreSplitter.pdfToImages("Rameau1.pdf", function (err, result) {
    xx = err;
});*/
module.exports = pdfSplitter;
var filePath="C:\\Users\\claud\\Downloads\\AlcinaProjectAteliersEuInstrumentation.pdf"
pdfSplitter.splitPdf(filePath,3)