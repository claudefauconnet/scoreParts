var scoreParts = (function () {
    var self = {};
    var imagesDir = "./data/images/";


    self.listScores = function () {
        var payload = {
            listScores: 1
        }
        $.ajax({
            type: "POST",
            url: "/score",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                for (var i = 0; i < data.length; i++) {
                    item = data[i].replace(".pdf", "");
                    $("#scoresSelect").append($('<option>', {
                        text: item,
                        value: item
                    }));
                }
                ;

            }, error: function (err) {
                console.lpg(err);
            }
        });

    }
    self.openFirstPdfPage = function () {
        var name = $('#scoresSelect').val();
        $("#scoresSelect").val(name);
        if (name == "")
            return;
        var name2 = imagesDir + name + "-1.png";
        scoreD3.drawImage(name2);
        currentPage = 1;
        $("#page").html("" + currentPage);
        $('#scrappingCommandsDiv').css('visibility', 'visible');

    }

    self.updateImage = function (link) {
        d3.select("svg").selectAll(".clipZone").remove();
        d3.selectAll(".img").attr("xlink:href", function (d) {
            return link;
        });
    }


    self.nextPage = function () {
        currentPage += 1;
        currentZoneInPage = 0;
        var name = $('#scoresSelect').val() + "-" + (currentPage);
        // drawImage(name);
        self.updateImage(imagesDir + name + ".png");
        $("#page").html("" + currentPage);

        $("#duplicateZonesButton").css("visibility","visible");

    }
    self.previousPage = function () {
        if (currentPage == 0)
            return;
        currentPage -= 1;

        currentZoneInPage = 0;
        var name = $('#scoresSelect').val() + "-" + (currentPage);
        self.updateImage(imagesDir + name + ".png");
        $("#page").html("" + currentPage);
        $("#duplicateZonesButton").css("visibility","visible");

    }

    self.generateInstrumentScore = function () {


        var part = prompt("nom de la partie");
        if (!part || part == "")
            return;
        self.setMessage("  La partie est en cours de génération , Attendez...", " blue");
        $('body').css("cursor", "progress");
        var pdfName = $('#scoresSelect').val();



      var  orderedZones= self.getOrderedZones();

        var zonesStr=JSON.stringify(orderedZones);
        var payload = {
            generatePart: 1,
            part: part,
            pdfName: pdfName,
            zonesStr: zonesStr
        }
        $.ajax({
            type: "POST",
            url: "/score",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                $("#duplicateZonesButton2").css("visibility","visible");


          /*      $("#resultDiv").html("<button onclick='hideResultDiv()')>Fermer</button>Privisualisation de la première page ...<button onclick='downloadScore()')>telechargez le pfd</button><BR><BR><img src='" + data.result + "' width='" + 600 + "' />");
                $("#resultDiv").css("visibility", "visible");
                self.setMessage("  La partie est générée.", " green");
                $('body').css('cursor', 'default');
            }, error: function (jqXHR, textStatus) {
                alert("Request failed: " + textStatus);
                self.setMessage("  Erreur dans la génération de la partie.", " red");*/
                $('body').css('cursor', 'default');


            }
        });


    }


    /***
     *
     * rearrange zoneIndex in each zone according to y
     *
     */
    self.getOrderedZones=function(){
        var pdfName = $('#scoresSelect').val();
        var orderedZones=[];
        for(var key in scoreD3.pagesZoneData){
            var zone=scoreD3.pagesZoneData[key];
            orderedZones.push({yIndex:((zone.page*1000)+zone.y),zone:zone})

        }
            orderedZones.sort(function (a,b){
                if(a.yIndex>b.yIndex)
                    return 1;
                if(a.yIndex<b.yIndex)
                    return-1;
                return 0;

            });
        var currentPage="";
        var zoneIndex=0;
        var orderedZones2=[]
        for(var i=0;i<orderedZones.length;i++){
            var page= orderedZones[i].zone.page;
            if(page!=currentPage){
                currentPage=page;
                zoneIndex=0
            }
            else
                zoneIndex+=1;
            var zone= orderedZones[i].zone;
            zone.zoneIndex=zoneIndex;
            zone.pdfName=pdfName
            orderedZones2.push(zone)


        }
        return orderedZones2;


    }





    self.repeatZonesFromPreviousPage=function(button){// from previous page


        var newZones=[];
        for(var key in scoreD3.pagesZoneData) {

            var zone = scoreD3.pagesZoneData[key];
            if (zone.page == currentPage - 1) {
                var newZone = jQuery.extend(true, {}, zone);//clone
                var zoneId = "p" + (zone.page + 1) + "z" + zone.zoneIndex;
                newZone.label = zoneId;
                newZone.divId = zoneId;
                newZone.page = currentPage;
                newZones.push(newZone);

            }
        }
            for(var i=0;i<newZones.length;i++){
                scoreD3.pagesZoneData[newZones[i].divId] =newZones[i];

            }
            scoreD3.drawZoneRect (newZones);
        $(button).css("visibility","hidden");




    }
    self.repeatZonesFromPreviousPart=function(button) {


        var zones = [];
        for (var key in scoreD3.pagesZoneData) {

            var zone = scoreD3.pagesZoneData[key];
            if (zone.page == currentPage) {
                zones.push(zone);

            }
        }

        scoreD3.drawZoneRect(zones);
        $(button).css("visibility", "hidden");
    }



        self.setMessage=function(message,color){

        if(!color) {
            color="black";
        }
            $("#message").css("color",color);
        $("#message").html(message);


    }

    return self;


})()