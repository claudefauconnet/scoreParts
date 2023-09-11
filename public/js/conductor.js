var Conductor = (function () {
    var self = {}

    self.conductorPartsPositions = {}
    self.conductorPagesPositions = []

    self.loadInstruments = function () {
        Common.fillSelectOptions("instrumentSelect", self.instruments, true)


    }

    self.registerInstrument = function () {
        var instrument = $("#instrumentSelect").val();
        if (!instrument)
            return;
        var orderedZones = scoreParts.getOrderedZones();
        var margin = parseInt($("#zoneMargin").val());
        var imgScaleCoef = $("#imgScaleCoef").val()
        self.conductorPartsPositions[instrument] = {
            margin: margin,

            zones: orderedZones,
            imgScaleCoef: imgScaleCoef
        }


    }


    self.registerAllInstruments = function () {

    }

    self.saveConductorPartsPositions = function () {

        if (!confirm("save new position :ATTENTION"))
            return;
        var pdfName = $('#scoresSelect').val();
        var payload = {
            save: 1,
            filePath: "positions/" + pdfName + ".json",
            contentStr: JSON.stringify(self.conductorPartsPositions)
        }
        $.ajax({
            type: "POST",
            url: "./file",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                scoreParts.setMessage("postions saved", "blue");
                $('body').css('cursor', 'default');


            },
            error: function (err) {
                $("#waitImg").css("visibility", "hidden");
                scoreParts.setMessage(err.responseText, "red")
            }
        });

    }
    self.loadConductorPartsPositions = function () {

        var pdfName = $('#scoresSelect').val();
        var payload = {
            load: 1,
            filePath: "positions/" + pdfName + ".json",
        }
        $.ajax({
            type: "POST",
            url: "./file",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                self.conductorPartsPositions = data
                var x = data;
                self.dx = 0;
                self.dy = 0;
                for (var instrument in data) {
                    var zone = data[instrument].zones[0]

                    var rect = {
                        x: zone.x,
                        y: zone.y,
                        width: zone.width,
                        height: zone.height,
                    }
                    var zoneDiv = svgSplitter.append("rect").attr("id", function (d) {
                        return "R_" + zone.divId;
                    }).attr("width", function (d) {
                        return rect.width;
                    }).attr("height", function (d) {
                        return rect.height;
                    }).attr("x", function (d) {
                        return rect.x;
                    }).attr("y", function (d) {
                        return rect.y;
                    }).style("stroke", "black").style("fill", function (d) {
                        var color = "F9B154";
                        color = Common.getResourceColor("instrument", instrument)
                        return color;

                    }).style("opacity", 0.4)

                        .attr("group", function (d) {
                            return "conductorZones";
                        })


                    /*    zoneDiv.append("text").attr("id", function (d) {
                            return "T_" + zone.divId;
                        }).attr("y", "15px").attr("x", "10px").text(function (d) {
                            return "xxxxx";
                        }).style("fill", "black").attr("class", "textSmall").style("font-size", "12px");*/

                }
                $("body").keydown(function (e) {

                    if (e.keyCode == 38) {
                        self.moveAllZones("up")
                    } else if (e.keyCode == 40) {
                        self.moveAllZones("down")
                    } else if (e.keyCode == 37) {
                        self.moveAllZones("left")
                    } else if (e.keyCode == 39) {
                        self.moveAllZones("right")
                    }


                })


                $('body').css('cursor', 'default');


            },
            error: function (err) {
                $("#waitImg").css("visibility", "hidden");
                scoreParts.setMessage(err.responseText, "red")
            }
        });
    }

    self.moveAllZones = function (direction) {
        var step = 2;

        if (direction == "up") {
            self.dy -= step
        } else if (direction == "down") {
            self.dy += step
        } else if (direction == "left") {
            self.dx -= step
        } else if (direction == "right") {
            self.dx += step
        }

        var xx = svgSplitter.selectAll("rect")
        var xx = svgSplitter.selectAll("rect").attr("transform", function (d) {

            return "translate(" + self.dx + "," + self.dy + ")";
        })


    }


    self.clearConductorPartsPositions = function () {
        self.conductorPartsPositions = {}
        scoreParts.startAllOver()

    }
    self.registerPagePositions = function () {
        var page = scoreParts.currentPage

        var pageConductorPartsPositions = {}
        for (var instrument in self.conductorPartsPositions) {
            pageConductorPartsPositions[instrument] = {margin: self.conductorPartsPositions.margin, zones: []}
            var zone = JSON.parse(JSON.stringify( self.conductorPartsPositions[instrument].zones[0]))
            zone.x += self.dx;
            zone.y += self.dy;
            var zoneId = zone.label.replace("p0", "p" + (page))
            zone.label = zoneId
            zone.divId = zoneId
            zone.page = page

            pageConductorPartsPositions[instrument].zones.push(zone)

        }


        self.conductorPagesPositions.push(pageConductorPartsPositions)




    }


    self.savePagesPositions = function () {
        self.self.conductorPagesPositions = []
    }

    self.savePagesPositions = function () {
        var pdfName = $('#scoresSelect').val();
        var payload = {
            save: 1,
            filePath: "positions/" + pdfName + "_pages_positions.json",
            contentStr: JSON.stringify(self.conductorPartsPositions)
        }
        $.ajax({
            type: "POST",
            url: "./file",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                scoreParts.setMessage("_pages_positions saved", "blue");
                $('body').css('cursor', 'default');


            },
            error: function (err) {
                $("#waitImg").css("visibility", "hidden");
                scoreParts.setMessage(err.responseText, "red")
            }
        });

    }

    self.generateConductorParts=function(){
        self.instrumentsZones = {}
        self.conductorPagesPositions.forEach(function (item) {
            for (var instrument in item) {
                if (!self.instrumentsZones[instrument]) {
                    self.instrumentsZones[instrument] = {margin: "", zones: []}
                }
                self.instrumentsZones[instrument].zones.push(item[instrument].zones[0])
            }

        })

        var instruments= Object.keys(self.instrumentsZones)

        async.eachSeries(instruments,function(instrument,callbackEach){
            scoreParts.setMessage("generating instrument "+instrument)
            var zones=self.instrumentsZones[instrument].zones
            scoreParts.generateInstrumentScore(instrument,zones,function(err, result){
                callbackEach()
            })
        },function(err){
            alert ("all done")
        })



    }

    self.instruments = [
        "Flute 1",
        "Flute Picollo",
        "Oboe 1,2",
        "Klarinette 1 in C",
        "Klarinette 2 in C",
        "Fagott 1,2",
        "Horn 1,2 in F",
        "Horn 3,4 in F",
        "Trompete 1,2 in F",
        "Trompete 3,4 in F",
        "Posaume 1,2 in F",
        "Posaume tuba 3 in F",
        "Pauken in C,F",
        "Kleine Trommel",
        "Harfe",
        "Violine 1",
        "Violine 2",
        "Alto 1",
        "violoncello 1",
        "Kontrabas 1",

    ]


    return self;


})()