
var fs=require('fs');
var PDFImage = require("pdf-image").PDFImage;



var scoreSplitter={
split:function(pdfFile) {
    var pdfImage = new PDFImage("../data/rameau1.pdf");
    pdfImage.convertPage(0).then(function (imagePath) {
        // 0-th page (first page) of the slide.pdf is available as slide-0.png
        fs.existsSync("../data/rameau1.png") // => true
    });

}



}


module.exports=scoreSplitter;