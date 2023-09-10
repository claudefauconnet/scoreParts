var Conductor=(function(){
   var self={}

    self.conductorPartsPositions={}


    self.loadInstruments=function(){
        Common.fillSelectOptions("instrumentSelect",self.instruments,true)


    }

    self.registerInstrument=function(){
        var instrument=$("#instrumentSelect").val();
        if(!instrument)
            return ;
        var orderedZones = scoreParts.getOrderedZones();
        var margin = parseInt($("#zoneMargin").val());
        var imgScaleCoef=$("#imgScaleCoef").val()
        self.conductorPartsPositions[instrument]={
            margin: margin,

            zones: orderedZones,
            imgScaleCoef:imgScaleCoef
        }


    }
    
    
    self.registerAllInstruments=function(){

    }

    self.saveConductorPartsPositions=function(){
        var pdfName = $('#scoresSelect').val();
        var payload = {
            save: 1,
            filePath:"positions/"+pdfName+".json",
           contentStr:JSON.stringify(self.conductorPartsPositions)
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
    self.loadConductorPartsPositions=function(){

        var pdfName = $('#scoresSelect').val();
        var payload = {
            load: 1,
            filePath:"positions/"+pdfName+".json",
        }
        $.ajax({
            type: "POST",
            url: "./file",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                self.conductorPartsPositions=data
                var x=data;
                for(var instrument in data){
                    var zone=data[instrument].zones[0]
                    var rect={
                        x:zone.x,
                        y:zone.y,
                        width:zone.width,
                        height:zone.height,
                    }
                   var zoneDiv= svgSplitter.append("rect").attr("id", function (d) {
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

                        return color;

                    }).style("opacity", 0.5);

                    zoneDiv.append("text").attr("id", function (d) {
                        return "T_" + zone.divId;
                    }).attr("y", "15px").attr("x", "10px").text(function (d) {
                        return "xxxxx";
                    }).style("fill", "black").attr("class", "textSmall").style("font-size", "12px");

                }


                scoreParts.setMessage("postions saved", "blue");
                $('body').css('cursor', 'default');


            },
            error: function (err) {
                $("#waitImg").css("visibility", "hidden");
                scoreParts.setMessage(err.responseText, "red")
            }
        });
    }


    self.clearConductorPartsPositions=function(){
       self.conductorPartsPositions={}
        scoreParts.startAllOver()

    }
    
    
    
    
    self.instruments=[
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