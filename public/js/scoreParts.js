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
                console.log(err);
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
        $("#page").html(" " + currentPage);
        $('#controlPanelDiv').css('visibility', 'visible');
        self.setMessage("cliquez au milieu des portées pour decouper une voix ","blue")

    }

    self.updateImage = function (link) {
        scoreD3.clearAllZonesRect();
        self.drawRectsForPage(currentPage);
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
        $("#page").html(" " + currentPage);

        $("#duplicateZonesButton").css("visibility", "visible");

    }
    self.previousPage = function () {
        if (currentPage == 0)
            return;
        currentPage -= 1;

        currentZoneInPage = 0;
        var name = $('#scoresSelect').val() + "-" + (currentPage);
        self.updateImage(imagesDir + name + ".png");
        $("#page").html(" " + currentPage);
        $("#duplicateZonesButton").css("visibility", "visible");

    }

    self.uploadFormData= function () {
        $('#controlPanelDiv').css('visibility', 'hidden');
        var form = $("#uploadForm")[0]
        var formData = new FormData(form);
        $("#waitImg").css("visibility","visible");
        self.setMessage("traitement en cours ...<br>cela peut prendre juqu'à une minute","blue")
        $.ajax({
            url: '/upload',
            data: formData,
            type: 'POST',
            contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
            processData: false, // NEEDED, DON'T OMIT THIS
            success: function (data, textStatus, jqXHR) {
                $("#waitImg").css("visibility","hidden");
                self.setMessage("Import terminé " +data.pages+" pages,<br> vous pouvez commencer le découpage","blue")
                var xx = data;
                self.listScores();
                $("#scoresSelect").val(data.pdfName);
                self.openFirstPdfPage()

            },
            error: function (err) {
                $("#waitImg").css("visibility","hidden");
                self.setMessage("ERREUR lors del'import"+err.responseText,"red")
                var xx = err;

            }

        });
    }

    self.generateInstrumentScore = function () {


        var part = prompt("nom de la partie");
        if (!part || part == "")
            return;
        self.setMessage("  La partie est en cours de génération , Attendez...", " blue");
        $('body').css("cursor", "progress");
        var pdfName = $('#scoresSelect').val();


        var orderedZones = self.getOrderedZones();

        var zonesStr = JSON.stringify(orderedZones);
        var payload = {
            generatePart: 1,
            part: part,
            pdfName: pdfName,
            zonesStr: zonesStr
        }

        $("#waitImg").css("visibility","visible");
        $.ajax({
            type: "POST",
            url: "/score",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                $("#waitImg").css("visibility","hidden");

                $("#duplicateZonesButton2").css("visibility", "visible");
              self.setMessage("la partition "+part+" est générée , <a target='_blanck' href='"+document.location.href+data.result+"'>télécharger</a>","blue");



                $('body').css('cursor', 'default');


            },
            error: function (err) {
                $("#waitImg").css("visibility","hidden");
                self.setMessage(err, "red")
            }
        });


    }


    /***
     *
     * rearrange zoneIndex in each zone according to y
     *
     */
    self.getOrderedZones = function () {
        var pdfName = $('#scoresSelect').val();
        var orderedZones = [];
        for (var key in scoreD3.pagesZoneData) {
            var zone = scoreD3.pagesZoneData[key];
            orderedZones.push({yIndex: ((zone.page * 1000) + zone.y), zone: zone})

        }
        orderedZones.sort(function (a, b) {
            if (a.yIndex > b.yIndex)
                return 1;
            if (a.yIndex < b.yIndex)
                return -1;
            return 0;

        });
        var currentPage = "";
        var zoneIndex = 0;
        var orderedZones2 = []
        for (var i = 0; i < orderedZones.length; i++) {
            var page = orderedZones[i].zone.page;
            if (page != currentPage) {
                currentPage = page;
                zoneIndex = 0
            }
            else
                zoneIndex += 1;
            var zone = orderedZones[i].zone;
            zone.zoneIndex = zoneIndex;
            zone.pdfName = pdfName
            orderedZones2.push(zone)


        }
        return orderedZones2;


    }


    self.repeatZonesFromPreviousPage = function (button) {// from previous page


        var newZones = [];
        for (var key in scoreD3.pagesZoneData) {

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
        for (var i = 0; i < newZones.length; i++) {
            scoreD3.pagesZoneData[newZones[i].divId] = newZones[i];

        }
        scoreD3.drawZoneRect(newZones);
        $(button).css("visibility", "hidden");


    }
    self.repeatZonesFromPreviousPart = function (button) {


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
    self.drawRectsForPage = function (page) {
        var zones = [];
        for (var key in scoreD3.pagesZoneData) {

            var zone = scoreD3.pagesZoneData[key];
            if (zone.page == page) {
                zones.push(zone);

            }
        }
        if (zones.length > 0)
            scoreD3.drawZoneRect(zones);
    }
    self.startAllOver=function(){
        scoreD3.deleteAllZones();
        self.openFirstPdfPage();
    }


    self.setMessage = function (message, color) {
        $("#message").css("visibility","visible");
        if (!color) {
            color = "black";
        }
        $("#message").css("color", color);
        $("#message").html(message);


    }
    self.getInfos=function(){

        self.setMessage("logiciel open source de découpage de partition sous licence MIT <br><a href='mailto://claude.fauconnet@neuf.fr'>Claude Fauconnet</a><br><a href='https://github.com/claudefauconnet/scoreparts'>Source</a>");


    }

    return self;


})()