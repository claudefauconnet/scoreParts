var fs = require('fs');
//var PDFImage = require("pdf-image").PDFImage;
var Jimp = require("jimp");
var async = require('async');
var PDFDocument = require('pdfkit');
var path = require('path');
var exec = require('child_process').exec;


var scoreSplitter = {
    zones: [],
    //  imagesDir: "./public/data/images/",

    rawImagesDir: "data/pdf",
    sourcePdfsDir: "../data/pdf/",
    blankPageImg: "../data/_blank.png",
    extractedImagesDir: "../public/data/images/",

    targetPdfDir: "../public/data/pdfs/",
    pageWidth: 595,
    pageHeight: 842,
    imageScaleCoef:1.10,//agrandit chaque image
    imageBackOffset:-150,//retrait de l'image vers la gauche

    listScores: function (callback) {
        var pdfs = [];
        var pdfsDir = path.resolve(__dirname, scoreSplitter.sourcePdfsDir);
        var files = fs.readdirSync(pdfsDir, 'utf8');
        for (var i = 0; i < files.length; i++) {
            var p = files[i].toLowerCase().lastIndexOf(".pdf");
            if (p > -1) {
                pdfs.push(files[i].substring(0, p))
            }
        }
        return callback(null, pdfs);
    },


    /* pdfToImages: function (pdfPath, callback) {
         var  pdfName=path.basename(pdfPath)

         var time=new Date();
         var time0=time;
         pdfName=pdfName.substring(0,pdfName.lastIndexOf('.'));
         var outputPrefix = pdfPath.substring(0, pdfPath.lastIndexOf(".")) + "-";

         gm().command('convert').in('+adjoin').in(pdfPath).write(outputPrefix+"%02d.png", function (err) {
             var x=err;
             // something
         });
     },*/



    pdfToImages: function (pdfPath, quality,options, callback) {
        if(!options)
            options={}
        var width = scoreSplitter.pageWidth;
        var imgQualities = {low: width * 2, medium: width * 4, high: width * 8}
        var imageWitdh = imgQualities[quality];

        //   var jarPath = path.resolve(__dirname, "../java/pdfbox-app-2.0.8.jar");
        // var jarPath = path.resolve(__dirname, "../java/pdf2images.jar");
        var pdfName = path.basename(pdfPath)
        pdfName = pdfName.substring(0, pdfName.lastIndexOf('.'));
        var time = new Date();
        var time0 = time;

        var outputPrefix = path.resolve(__dirname, scoreSplitter.extractedImagesDir + pdfName + "-");

        if(options.targetDir)
            outputPrefix=options.targetDir;

            var pages = "[0-30]"
        var GraphicsMagickExe = "gm";
        if (path.sep == "\\") {//windows
            GraphicsMagickExe = "\"C:\\Program Files\\GraphicsMagick-1.3.40-Q16\\gm.exe\"";
            GraphicsMagickExe = "\"C:\\Program Files\\GraphicsMagick-1.3.40-Q16\\gm.exe\"";
        }
        var cmd = GraphicsMagickExe + " convert -density 600 " + pdfPath + pages + " -resize " + imageWitdh + " +adjoin " + outputPrefix + "%d.png"

        console.log("EXECUTING " + cmd)
        exec(cmd, function (err, stdout, stderr) {
            if (err) {
                console.log(stderr);
                return callback(err);
            }
            var time2 = new Date()
            console.log("extract images form pdf took : " + (time2 - time));
            time = time2;
            console.log(stdout);

            callback(null, {pages: 0, pdfName: pdfName, duration: (time2 - time0)});

        });


    }

    ,


    generatePart: function (pdfName, part, zonesStr, margin,imgScaleCoef, callback) {

        var zones = JSON.parse(zonesStr);

        //store the zones coordinates for a replay (eventually)
        //  fs.writeFileSync(scoreSplitter.imagesDir + "zones-" + pdfName + "-" + part + ".json", zonesStr)
        //    scoreSplitter.zones = zones;


        var targetPagesImages = [];
        async.waterfall([
            async.apply(scoreSplitter.cropImages, zones, margin),
            scoreSplitter.setTargetPages,
            scoreSplitter.blitImages,

        ], function (err, pagesImagesArray) {
            scoreSplitter.writePagesToPdf(pdfName, part, pagesImagesArray, function (err, result) {
                if (err)
                    return callback(err);
                callback(null, result);
            });

        })

    }
    ,


    cropImages: function (zones, margin, callbackWaterfall) {
        var zonesWithImages = []
        async.eachSeries(zones, function (zone, callbackEach) {
            var strs = zone.divId.split("z");
            var page = "" + strs[0].substring(1);//(parseInt( )+1;//decalage dans les numero d'images
            var sourceImg = zone.pdfName + "-" + page + ".png";
            var imageDir = path.resolve(__dirname, scoreSplitter.extractedImagesDir);
            var imageFile = imageDir + path.sep + sourceImg;

            Jimp.read(imageFile, function (err, image) {

                if (err) {
                    console.log(err);
                    return callbackEach(err);
                }
                var w = image.bitmap.width;
                var h = image.bitmap.height;
                var scale = w / scoreSplitter.pageWidth;

                var zoneImg = image.crop(zone.x * scale, zone.y * scale, zone.width * scale, zone.height * scale);
                //   zoneImg.resize(zone.width,Jimp.AUTO,Jimp.RESIZE_NEAREST_NEIGHBOR);
                zoneImg.getBuffer(Jimp.MIME_PNG, function (err, img) {

                    zonesWithImages.push({img: img, zone: zone, width: w, scale: scale})
                    callbackEach();
                });


            });

        }, function (err) {
            if (err)
                return callbackWaterfall(err);
            callbackWaterfall(null, zonesWithImages, margin);

        })


    }
    ,

    setTargetPages: function (zonesWithImages, margin, callbackWaterfall) {
        var initialYOffset = 20
        var offsetX = 20;
        var offsetY = initialYOffset;
        var vertStep = 5;
        var currentPage = [];
        var maxPageYoffset = 800;
        var pageFull = false;
        var pages = [];
        for (var i = 0; i < zonesWithImages.length; i++) {
            var zone = zonesWithImages[i].zone;

            var pageZone = {
                x: zone.x,
                y: offsetY,
                img: zonesWithImages[i].img,
                width: zonesWithImages[i].width,
                scale: zonesWithImages[i].scale


            }
            currentPage.push(pageZone);
            offsetY += zone.height + vertStep;
            if (offsetY + zone.height > maxPageYoffset) {
                pageFull = true;
                pages.push(currentPage);
                currentPage = [];
                offsetY = initialYOffset;

            } else {
                pageFull = false;
            }


            //    offsetY += zone.height + vertStep;//*(zonesWithImages[i].scale);


        }
        if (!pageFull)
            pages.push(currentPage);
        callbackWaterfall(null, pages, margin)

    }

    ,


    blitImages: function (pages, margin, callbackWaterfall) {
        var targetImages = [];

        async.eachSeries(pages, function (page, callbackPages) {
            var scale = page[0].scale;
            targetImages.scale = scale;
            var w = Math.round((scoreSplitter.pageWidth - margin) * scale);
            var h = Math.round((scoreSplitter.pageHeight - margin) * scale);
            var blanckImg = new Jimp(w, h, 0xFFFFFFFF, function (err, blanckImg) {
                // this image is 256 x 256, every pixel is set to 0x00000000

                //     blanckImg.resize(blankWidth,blankHeight);


                async.eachSeries(page, function (pageZone, callbackZones) {

                        Jimp.read(pageZone.img, function (err, image) {
                            if (err) {
                                console.log(err);
                                return callbackZones(err);
                            }
                            //   console.log("blit"+ pageZone.x);
                            blanckImg.blit(image, pageZone.x * scale, pageZone.y * scale);
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


    writePagesToPdf: function (pdfName, part, pagesImagesArray, callback) {
        var title = pdfName + "-" + part;
        var pdfsDir = path.resolve(__dirname, scoreSplitter.targetPdfDir);
        var partPdfFile = pdfsDir + path.sep + pdfName + "-" + part + ".pdf";
        if (fs.existsSync(partPdfFile)) {

            try {
                fs.unlinkSync(partPdfFile);
            } catch (e) {
                return callback("fichier existant et ouvert impossible d'enrgistrer le nouveau fichier");
            }
        }
        var partPdfUrl = "data/pdfs/" + pdfName + "-" + part + ".pdf";
        var doc = new PDFDocument({size: [scoreSplitter.pageWidth * pagesImagesArray.scale, scoreSplitter.pageHeight * pagesImagesArray.scale]});
        var pageNumber = 1;
        doc.on('pageAdded',
            function () {
                // Don't forget the reset the font family, size & color if needed
                doc.fontSize(16)
                var str=title+" page "+(++pageNumber)
                doc.text(str, 10, 10, {align: 'left'});
                //  doc.fontSize(28)
                // doc.text(++pageNumber, 0.5 * (doc.page.width - 100), 40, {width: 100, align: 'center'});
            }
        );

        doc.pipe(fs.createWriteStream(partPdfFile));

        for (var i = 0; i < pagesImagesArray.length; i++) {
            //   doc.image(pagesImagesArray[i], 0, 50, {scale: (1 / pagesImagesArray.scale)})
            doc.image(pagesImagesArray[i], scoreSplitter.imageBackOffset, 50,{scale:scoreSplitter.imgScaleCoef})
            if (i == 0) {
                doc.fontSize(36);
                doc.text(title, (0.5 * doc.page.width) - 400, 30, {width: 800, align: 'center'});
            }

            doc.addPage();

        }
        doc.end();
        callback(null, partPdfUrl)

    }
    ,


}
/*scoreSplitter.pdfToImages("12.3._Coro_Alcina_2_flûtes.pdf", function (err, result) {
    xx = err;
});*/
module.exports = scoreSplitter;