var ImageResize = require('node-image-resize'),
    fs = require('fs');
var Promise = require('promise');

var image = new ImageResize('D:\\GitHub\\scoreparts\\public\\data\\images\\IMSLP39844-PMLP87322-Rameau_Concerts_Sextuor_V-1.png');

image.loaded.then(function(){
    image.smartResizeDown({
        width: 592,
        height: 842
    }).then(function () {
        image.stream(function (err, stdout, stderr) {
            var writeStream = fs.createWriteStream('D:\GitHub\scoreparts\public\data\images\\IMSLP39844-PMLP87322-Rameau_Concerts_Sextuor_V-1XX.png');
            stdout.pipe(writeStream);
        });
    });
});