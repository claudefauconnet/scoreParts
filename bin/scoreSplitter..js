var fs = require('fs');
var PDFImage = require("pdf-image").PDFImage;
var Jimp = require("jimp");
var async = require('async');
var PDFDocument = require('pdfkit');
//var pdf2png=require('pdf2png-mp2');


//var pdf2image = require('pdf2image');


var scoreSplitter = {
    zones: [],
    //  imagesDir: "./public/data/images/",
    imagesDir: "D:\\GitHub\\scoreparts\\public\\data\\images\\",

    listScores: function (callback) {
        return callback(null, ["rameau1.pdf", "IMSLP-berceuseFaure.pdf","Rameau-LaForqueray.pdf"]);
    },


    /* split2:function(){
         var pdfFile=scoreSplitter.imagesDir + "rameau1.pdf"
         pdfFile="C:\\Users\\claud\\Downloads\\bdHJy_violin_II.pdf"
         pdf2image.convertPDF(pdfFile).then(
             function(pageList){
                 console.log(pageList);
             }
         );



     },*/
    pdfBoxToSize: function (pdfName) {

        var files = []
        var dir = "D:\\GitHub\\scoreparts\\data\\";
        for (var i = 1; i < 20; i++) {
            var k = i
            var imgFile = pdfName+"-" + k + ".png";
            files.push(imgFile);
        }

        async.eachSeries(files, function (imgFile, callback) {
                Jimp.read( dir +imgFile, function (err, image) {
                    if (err)
                        return console.log(err);
                    image.resize(595, 842);
                //    image.scale(0.5)
                    var dir2 = "D:\\GitHub\\scoreparts\\public\\data\\images\\";
                    var j = i - 1
                    image.write(dir2 + imgFile);
                    callback()
                });
            }, function (err) {
                console.log('done');
            }
        )


    }

    ,


    split: function (pdfFile) {
        var options = {};
        options.convertOptions = {};
        options.convertOptions["-resize"] = "595x842";
        //  options.convertOptions["-resize"] =  "1190x1684";
        options.convertOptions["-quality"] = "100";
        //  options.convertOptions["-resolution"] =  "512";

        // var pdfImage = new PDFImage("/var/lib/nodejs/scoreparts/data/rameau1.pdf",options);
        var pdfImage = new PDFImage("/var/lib/nodejs/scoreparts/data/IMSLP-berceuseFaure.pdf");


        var count = -1;
        var maxPage = 100;
        async.doWhilst(function (callback) {
                count++;
                console.log(count)
                pdfImage.convertPage(count).then(function (imagePath) {
                    console.log(imagePath);

                    if (!fs.existsSync("imagePath"))
                        count == 1000;
                    callback();

                })


            }, function () {//test
                if (count > maxPage)
                    return false;
                return true;

            },
            function (resp) {// at the end
                console.log("done " + count)
            })
    }

    ,

    generatePart: function (pdfName, part, zonesStr, callback) {

        var zonesObj = JSON.parse(zonesStr);
        fs.writeFileSync(scoreSplitter.imagesDir + "zones-" + pdfName + "-" + part + ".json", zonesStr)
        scoreSplitter.zones = [];
        for (var key in zonesObj) {
            zonesObj[key].pdfName = pdfName;
            scoreSplitter.zones.push(zonesObj[key])

        }


        var targetPagesImages = [];
        async.waterfall([
            scoreSplitter.cropImages,
            scoreSplitter.setTargetPages,
            scoreSplitter.blitImages,


        ], function (err, pagesImagesArray) {
            scoreSplitter.wtitePagesToPdf(pdfName, part, pagesImagesArray, function (err, result) {
                if (err)
                    return callback(err);
                callback(null, result);
            });

        })

    }
    ,


    cropImages: function (callbackWaterfall) {
        var zonesWithImages = []
        async.eachSeries(scoreSplitter.zones, function (zone, callbackEach) {
            var strs = zone.divId.split("z");
            var page =""+strs[0].substring(1);//(parseInt( )+1;//decalage dans les numero d'images
            var sourceImg = zone.pdfName + "-" + page + ".png";
            var imageFile = scoreSplitter.imagesDir + sourceImg;

            Jimp.read(imageFile, function (err, image) {
                if (err) {
                    console.log(err);
                    return callbackEach(err);
                }
                var zoneImg = image.crop(zone.x, zone.y, zone.width, zone.height);
                zoneImg.getBuffer(Jimp.MIME_PNG, function (err, img) {
                    zonesWithImages.push({img: img, zone: zone})
                    callbackEach();
                });


            });

        }, function (err) {
            if (err)
                return callbackWaterfall(err);
            callbackWaterfall(null, zonesWithImages);

        })


    }
    ,

    setTargetPages: function (zonesWithImages, callbackWaterfall) {
        var offsetX = 20;
        var offsetY = 20;
        var vertStep = 20;
        var currentPage = [];
        var pages = [];
        for (var i = 0; i < zonesWithImages.length; i++) {
            var zone = zonesWithImages[i].zone;
            offsetY += zone.height + 20;
            if (offsetY > 700) {
                pages.push(currentPage);
                currentPage = [];
                offsetY = 20;
            }
            var pageZone = {
                x: zone.x,
                y: offsetY,
                img: zonesWithImages[i].img
            }
            currentPage.push(pageZone);
        }
        pages.push(currentPage);
        callbackWaterfall(null, pages)

    }

    ,


    blitImages: function (pages, callbackWaterfall) {
        var targetImages = [];
        async.eachSeries(pages, function (page, callbackPages) {
            var blanckImgFile = scoreSplitter.imagesDir + "_blanck.png";
            Jimp.read(blanckImgFile, function (err, blanckImg) {


                async.eachSeries(page, function (pageZone, callbackZones) {

                        Jimp.read(pageZone.img, function (err, image) {
                            blanckImg.blit(image, pageZone.x, pageZone.y);
                            callbackZones();

                        })


                    }

                    , function (err) {
                        if (err)
                            return callbackPages(err);

                        blanckImg.getBuffer(Jimp.MIME_PNG, function (err, imgBuffer) {
                            targetImages.push(imgBuffer);
                            callbackPages();
                        });


                    })

            })
        }, function (err) {
            if (err)
                return callbackWaterfall(err);
            callbackWaterfall(null, targetImages);

        })

    }
    ,


    wtitePagesToPdf: function (pdfName, part, pagesImagesArray, callback) {
        var title = pdfName + "-" + part;
        var partPdfFile = scoreSplitter.imagesDir + pdfName + "-" + part + ".pdf";
        if (fs.existsSync(partPdfFile))
            fs.unlinkSync(partPdfFile)
        var partPdfUrl = "/data/images" + pdfName + "-" + part + ".pdf";
        var doc = new PDFDocument;
        var pageNumber = 1;
        doc.on('pageAdded',
            function () {
                // Don't forget the reset the font family, size & color if needed
                doc.text(++pageNumber, 0.5 * (doc.page.width - 100), 40, {width: 100, align: 'center'});
            }
        );

        doc.pipe(fs.createWriteStream(partPdfFile));

        for (var i = 0; i < pagesImagesArray.length; i++) {
            doc.image(pagesImagesArray[i], 0, 50)
            if (i == 0)
                doc.text(title, 0.5 * (doc.page.width - 300), 70, {width: 300, align: 'center'});
            doc.addPage();

        }
        doc.end();
        callback(null, partPdfUrl)

    }
    ,


    cropTest: function (imageFile, x, y, w, h) {
        Jimp.read(imageFile, function (err, image) {
            // do stuff with the image (if no exception)
            image.crop(x, y, w, h).write(imageFile + ".XX.png");
            ;
        });


    }


}

//scoreSplitter.pdfBoxToSize("Rameau-LaForqueray");
module.exports = scoreSplitter;