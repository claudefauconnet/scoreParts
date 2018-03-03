
    fs = require('fs');
var path=require('path');

var inputBuffer=fs.readFileSync(path.resolve(__dirname,"testResize.png"));
    var outputFile=(path.resolve(__dirname,"testResizeOut.png"));
    const sharp = require('sharp');
    sharp(inputBuffer)
        .resize(592)
        .toFile(outputFile, function(err, info){
            if(err)
           return  console.log(err)
        return console.log(info);

    })
