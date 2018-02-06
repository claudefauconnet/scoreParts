var  Document = require('node-pdfbox');


var pdfToImages={

    extract:function() {
        var pdfImage = new PDFImage("/var/lib/nodejs/scoreparts/data/rameau1.pdf");
        var document = Document.loadSync(pdfImage);
        var numberOfPages = document.pagesCountSync();
        for(var i=0;i<numberOfPages.length;i++){

            var page = document.getPageSync(i);
           var image = page.getImageSync(595, 842);
            image.saveSync('/var/lib/nodejs/scoreparts/data/IMSLP-berceuseFaure'+i, 'png');

        }



    }




}

module.exports=pdfToImages