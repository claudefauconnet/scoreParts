var scoreParts = (function () {
    var self = {};
    var imagesDir = "./images/";


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
        $("#fileName").val(name);
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
        var name = $('#fileName').val() + "-" + (currentPage);
        // drawImage(name);
        self.updateImage(imagesDir + name + ".png");
        $("#page").html("" + currentPage);

    }
    self.previousPage = function () {
        if (currentPage == 0)
            return;
        currentPage -= 1;

        currentZoneInPage = 0;
        var name = $('#fileName').val() + "-" + (currentPage);
        self.updateImage(imagesDir + name + ".png");
        $("#page").html("" + currentPage);

    }

    self.generateInstrumentScore = function () {


        var part = prompt("nom de la partie");
        if (!part || part == "")
            return;
        self.setMessage("  La partie est en cours de génération , Attendez...", " blue");
        $('body').css("cursor", "progress");
        var pdfName = $('#fileName').val();

        var zonesStr=JSON.stringify(scoreD3.pagesZoneData);
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
                $("#resultDiv").html("<button onclick='hideResultDiv()')>Fermer</button>Privisualisation de la première page ...<button onclick='downloadScore()')>telechargez le pfd</button><BR><BR><img src='" + data.result + "' width='" + 600 + "' />");
                $("#resultDiv").css("visibility", "visible");
                self.setMessage("  La partie est générée.", " green");
                $('body').css('cursor', 'default');
            }, error: function (jqXHR, textStatus) {
                alert("Request failed: " + textStatus);
                self.setMessage("  Erreur dans la génération de la partie.", " red");
                $('body').css('cursor', 'default');


            }
        });


    }
    self.downloadScore = function () {
        var url = "data/" + downoladFileName;

        window.open(url, downoladFileName, "height=1300");
    }
    self.setMessage = function (str) {
        $("#message").html(str);
    }
    self.hideResultDiv = function () {
        $("#resultDiv").css("visibility", "hidden");
    }

    self.clearZones = function () {
        d3.select("svg").selectAll(".clipZone").remove();
        scoreD3.pagesZoneData = {};
        currentPage = 1;
        var name = $('#fileName').val() + "-" + (currentPage);
        currentZoneInPage = 0;
        self.updateImage(imagesDir + name + ".png");
    }


    return self;


})()