var ScoreDraw=(function(){

    var self={};
    self.imageDivId="myCanvas"


    self.pagesZoneData = {}
    self.imgLoaded = false;
    var currentZone = null;

    var zoneHeight = 50;
    var imageWidth = 595;
    var imageHeight = 842;
    var zoneDragMode;

    var mouseClip = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
    };


    self.drawImage = function (imageUrl) {

        var data = [{
            id: "img1",
            x: 0,
            y: 0,
            w: imageWidth,
            h: imageHeight,
            href: imageUrl

        }];

        self.imgLoaded = false;
        $("#waitImg").css("visibility", "visible");
        $("#generatePartButton").css("visibility", "hidden");


  //      d3.select("svg").selectAll("*").remove();
     //   $("#imageSplitterDiv").html("");
       $("#imageSplitterDiv").css("width", "" + imageWidth + "px");
        $("#imageSplitterDiv").css("height", "" + imageHeight + "px");

        $("#myCanvas").css("width", "" + imageWidth + "px");
        $("#myCanvas").css("height", "" + imageHeight + "px");

        $("#myImg").css("width", "" + imageWidth + "px");
        $("#myImg").css("height", "" + imageHeight + "px");


        const myCanvas = document.getElementById("myCanvas");
     //   var myCanvas = document.getElementById("myCanvas");
        var ctx = myCanvas.getContext('2d');
        $("#myImg").attr("src",imageUrl);


        $( "#myImg" ).draggable({
            start: function() {

            },
            drag: function() {

            },
            stop: function() {

            }
        });





        return;

        var img = new Image();
        img.onload = function(){
           // ctx.drawImage(img,-100,-100);
           ctx.drawImage(img,0,0,imageWidth,imageHeight); // Or at whatever offset you like
        };
        img.src = imageUrl;






    }





    return self;



})()