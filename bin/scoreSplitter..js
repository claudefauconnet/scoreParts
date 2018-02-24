var fs = require('fs');
//var PDFImage = require("pdf-image").PDFImage;
var Jimp = require("jimp");
var async = require('async');
var PDFDocument = require('pdfkit');
var path = require('path');
var exec = require('child_process').exec;
//var pdf2png=require('pdf2png-mp2');


//var pdf2image = require('pdf2image');


var scoreSplitter = {
    zones: [],
    //  imagesDir: "./public/data/images/",

    rawImagesDir: "../data/pdf/",
    resizedImagesDir: "../public/images/",
    pdfsDir: "../data/pdf/",

    listScores: function (callback) {
        var pdfs=[];
        var pdfsDir=path.resolve(__dirname,scoreSplitter.pdfsDir);
       var files = fs.readdirSync(pdfsDir, 'utf8');
       for (var i=0;i<files.length;i++){
           var p=files[i].toLowerCase().lastIndexOf(".pdf");
           if(p>-1){
               pdfs.push(files[i].substring(0,p))
           }
        }
        return callback(null,pdfs);
    },



    pdfToImages: function (pdfName, callback) {

        var jarPath = path.resolve(__dirname, "../java/pdfbox-app-2.0.8.jar");
        var pdfPath = pdfName;//path.resolve(__dirname, "../data/pdf/" + pdfName);
        var outputPrefix = pdfPath.substring(0, pdfPath.lastIndexOf(".")) + "-";
        outputPrefix = path.resolve(outputPrefix.replace(/data[\/\\]pdf/g, "data/png/raw"));
        var cmd = "java -jar " + jarPath + " PDFToImage -outputPrefix " + outputPrefix + " -imageType  png " + pdfPath
        console.log("EXECUTING " + cmd)
        exec(cmd, function (err, stdout, stderr) {
            if (err)
                return callback(err);
            if (stderr && stderr != "") {
                console.log(stderr);
                return callback(stderr);


            }
            console.log(stdout);
            var i = 1;
            var stop = false;
            var imgPathes = []
            do {
                var imgPath = outputPrefix + i + ".png";
                if (!fs.existsSync(imgPath))
                    stop = true;
                else {
                    i++;
                    imgPathes.push(imgPath)
                }

            } while (stop === false || i > 10000);

            async.eachSeries(imgPathes, function (imgPath, callbackEachImg) {
                    Jimp.read(imgPath, function (err, image) {
                        if (err) {
                            console.log(err);
                            return callbackEachImg(err);
                        }
                        image.resize(595, 842);
                        var imageName=path.basename(imgPath);

                        var imgPathResized = path.resolve(__dirname,scoreSplitter.resizedImagesDir+imageName);

                        image.write(imgPathResized);
                        callbackEachImg()
                    });
                }, function (err) {//end eachSeries


                    async.eachSeries(imgPathes, function (imgPath, callbackEachImg2) {
                        try {
                            fs.unlinkSync(imgPath);
                        }
                        catch (e) {
                           return callbackEachImg2(e);
                        }
                        callbackEachImg2();
                    }, function (err) {
                        if (err)
                            return callback(err);
                        console.log("done images :" + imgPathes.length);
                        callback("done images :" + imgPathes.length);

                    })
                }
            )
        });
        return;
        var files = []
        var dir = "D:\\GitHub\\scoreparts\\data\\";


    }

    ,


   /* split: function (pdfFile) {
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

    ,*/

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
            var page = "" + strs[0].substring(1);//(parseInt( )+1;//decalage dans les numero d'images
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
/*scoreSplitter.pdfToImages("Rameau1.pdf", function (err, result) {
    xx = err;
});*/
module.exports = scoreSplitter;