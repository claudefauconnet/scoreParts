var svgSplitter;
var currentZone;
var globalWidth = 1000;
var globalHeight = 1400;
var currentPage = 1;
var currentZoneInPage = 0;
var aDiv;
var canDrawRect = false;
var downoladFileName = "";
var vOffset = 0;// a revoir
var isResizing = false;

var mouseDragCurrentX=0;
var mouseDragCurrentY=0;

var mouseClip = {
	x1 : 0,
	y1 : 0,
	x2 : 0,
	y2 : 0
};

var zoneData = [];
var pagesZoneData = {}

function drawImage(name) {

	var data = [ {
		id : "img1",
		x : 0,
		y : 0,
		w : globalWidth,
		h : globalHeight,
		// href: "http://localhost:8082/imageSplitter/images/testImg.png"
		href : "data/" + name + ".jpg"

	} ];

	// if (!svgSplitter)

	d3.select("svg").selectAll("*").remove();
	$("#imageSplitterDiv").html("");
	$("#imageSplitterDiv").css("width", "" + globalWidth + "px");
	$("#imageSplitterDiv").css("height", "" + globalHeight + "px");
	svgSplitter = d3.select("#imageSplitterDiv").append("svg").attr("width", globalWidth).attr("height", globalHeight);
	aDiv = svgSplitter.selectAll().data(zoneData).enter().append("svg:g").on("click", click).attr("class", "clipZone");

	imgs = svgSplitter.selectAll("image").data(data);
	imgs.enter().append("svg:image") // .on("click", click)
	.attr("class", function(d) {
		return "img";
	})
	// .attr("xlink:href",
	// "http://localhost:8082/imageSplitter/images/testImg.png")
	.attr("xlink:href", function(d) {
		return d.href;
	}).attr("width", function(d) {
		return "" + d.w + "px";
	}).attr("height", function(d) {
		return "" + d.h + "px";
	});

	var drag = d3.behavior.drag().on("dragstart", function(aaa) {
		var x = d3.event.sourceEvent.offsetX;
		var y = d3.event.sourceEvent.offsetY;
		mouseClip.x1 = x;
		mouseClip.y1 = y;
		d3.select(".dragRect").attr("x", x).attr("y", y);
	}).on("drag", function(d) {
		var x = d3.event.sourceEvent.offsetX;
		var y = d3.event.sourceEvent.offsetY;
		mouseClip.x2 = x;
		// mouseClip.y2 = mouseClip.y1 + 5;
		mouseClip.y2 = y;
		setMessage("rect :" + JSON.stringify(mouseClip));
		d3.select(".dragRect").attr("width", x - mouseClip.x1).attr("height", y - mouseClip.y1);
	}).on("dragend", function(d) {

		var label = "p" + currentPage + "z" + currentZoneInPage;
		if (label && label.length > 0) {

			drawZoneRect(mouseClip, "Z", label);
			/*
			 * var e = d3.event; if (!aDiv) {
			 * 
			 *  } else{ moveRect(mouseClip); }
			 */

		}

	});

	d3.selectAll(".img").call(drag);
	if (currentPage == 1)
		canDrawRect = true;

	// **************************DragRect************************

	var dataRect = [ {
		x : 10,
		y : 10,
		w : 100,
		h : 100,

	} ];
	var dragRect = svgSplitter.selectAll().data(dataRect).enter().append("rect").attr("width", function(d) {
		return d.w;
	}).attr("height", function(d) {
		return d.h;
	}).attr("x", function(d) {
		return d.x;
	}).attr("y", function(d) {
		return d.y;
	}).style("z-index", 100).style("stroke", "black").style("fill", "transparent").attr("class", "dragRect");

}

// **************************DragRect************************
function drawZoneRect(clipRect, type, label) {
	if (!canDrawRect)
		return;
	if (currentPage > 1)
		canDrawRect = false;

	id =label;

	zoneData = [ {
		label : label,
		divId : id,
		x : clipRect.x1,
		y : clipRect.y1,
		width : clipRect.x2 - clipRect.x1,
		height : clipRect.y2 - clipRect.y1
	} ];
	pagesZoneData["p" + currentPage + "z" + currentZoneInPage] = zoneData[0];
  currentZoneInPage++;
	aDiv = svgSplitter.selectAll().data(zoneData).enter().append("svg:g").on("click", click).attr("class", "clipZone")
//.attr("class", label)
	.attr("id", function(d) {
		return "clipZone";
	}).attr("width", function(d) {
		return d.width;
	}).attr("height", function(d) {
		return d.height;
	});

	aDiv.append("rect").attr("id", function(d) {
		return "R_" + d.divId;
	}).attr("width", function(d) {
		return d.width;
	}).attr("height", function(d) {
		return d.height;
	}).style("stroke", "black").style("fill", function(d) {
		var color = "F9B154";

		return color;

	}).style("opacity", 0.5);

	aDiv.append("text").attr("id", function(d) {
		return "T_" + d.divId;
	}).attr("y", "10px").attr("x", "" + (globalWidth - 80) + "px").text(function(d) {
		return d.label;
	}).style("fill", "black").attr("class", "textSmall").style("font-size", "14px");

	// aDiv.attr("x", clipRect.x1).attr("y", clipRect.y1);
	aDiv.attr("transform", function(d) {
		// d.x=-d.x/2;d.y=-d.y/2;
		return "translate(" + clipRect.x1 + "," + (clipRect.y1) + ")";

	});

	aDiv.call(d3.behavior.drag().on("dragstart", initDrag).on("drag", moveZone).on("dragend", resizeZone));

}

function click() {
	currentZone = this;
	var id = this.__data__.divId;
	/*
	 * svgSplitter.selectAll("#" + id).style("fill", function(d) { var color =
	 * "#ddf";
	 * 
	 * return color;
	 * 
	 * });
	 */

}

function dblclick() {

}


function initDrag(zone) {
	//var oldRect = pagesZoneData["p" + currentPage + "z" + currentZoneInPage];
	oldRect = pagesZoneData[zone.divId];
	var oldX2 = oldRect.x + oldRect.width;
	var oldY2 = oldRect.y + oldRect.height;
	var evtX = d3.event.sourceEvent.offsetX;
	var evtY = d3.event.sourceEvent.offsetY;
	 mouseDragCurrentX=evtX;
	 mouseDragCurrentY=evtY;
	if (evtX > (oldX2 - 20) && evtY > (oldY2 - 20)) {
		isResizing = true;
	} else {
		isResizing = false;
	}

}
function moveZone(zone) {
	if (isResizing) {
		return;
	}
	if (!d3.event)
		return;
	
	oldRect = pagesZoneData[zone.divId];
	//var dx=d3.event.sourceEvent.offsetX-mouseDragCurrentX;
	//var dy=d3.event.sourceEvent.offsetY-mouseDragCurrentY;
	//console.log(d3.event.dx);
	var dx=d3.event.dx;
	var dy=d3.event.dy;
	

	
	var newX=oldRect.x+dx;
	var newY=oldRect.y+dy;
	// console.log(pagesZoneData["p"+currentPage+"z"+currentZoneInPage]);
	pagesZoneData[zone.divId].x = newX;
	pagesZoneData[zone.divId].y =newY;
	//d3.select(this).attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
	d3.select(this).attr("transform", "translate(" + newX + "," + newY + ")");

	 mouseDragCurrentX=d3.event.x;
	 mouseDragCurrentY=d3.event.y;

}

function resizeZone(zone) {
	var zzz=zone;
	if (!d3.event)
		return;
	if (isResizing) {
		//var oldRect = pagesZoneData["p" + currentPage + "z" + currentZoneInPage];
		oldRect = pagesZoneData[zone.divId];

		var evtX = d3.event.sourceEvent.layerX;
		var evtY = d3.event.sourceEvent.layerY;
	//	console.log(evtX+"  :  "+evtY);
		var newWidth = evtX - oldRect.x;
		var newHeight = evtY - oldRect.y;
		setMessage(newWidth+"  :  "+newHeight);
		var xCoef = newWidth / oldRect.width;
		var yCoef = newHeight / oldRect.height;
		pagesZoneData[zone.divId].width = newWidth;
		pagesZoneData[zone.divId].height = newHeight;

	
	
	
	d3.select(this).attr("transform", "translate(" + oldRect.x + "," + oldRect.y + ")," + "scale(" + xCoef + "," + yCoef + ")");
	d3.select(".dragRect").attr("width", newWidth).attr("height", newHeight);

		isResizing = false;

	}

}

function drawDragRect() {

}

function updateImage(link) {
	d3.selectAll(".img").attr("xlink:href", function(d) {
		return link;
	});
}

function openFile() {
	var name = $('#fileName').val() + "1";
	drawImage(name);
	currentPage = 1;
	$("#page").html("" + currentPage);

}
function nextPage() {
	currentPage += 1;
	currentZoneInPage = 0;
	if(false){
	if (!pagesZoneData["p" + currentPage + "z" + currentZoneInPage]) {
		pagesZoneData["p" + currentPage + "z" + currentZoneInPage] = jQuery.extend({}, zoneData[0]);
	}
	}

	var name = $('#fileName').val() + (currentPage);
	// drawImage(name);
	updateImage("data/" + name + ".jpg");
	// drawZoneRect(mouseClip, "Z", name);
	$("#page").html("" + currentPage);

}
function previousPage() {
	currentPage -= 1;
	var name = $('#fileName').val() + (currentPage);
	// drawImage(name);
	updateImage("data/" + name + ".jpg");
	// drawZoneRect(mouseClip, "Z", name);
	$("#page").html("" + currentPage);

}

function generateInstrumentScore() {
	setMessage(" gw :" + globalWidth + " gh :" + globalHeight + "rects :" + JSON.stringify(pagesZoneData));
	var label = prompt("zone name");
	var fileName = $('#fileName').val();
	downoladFileName = fileName + "_" + label + ".pdf";
	if (label && label.length > 0) {
		var params = {
			action : "generateInstrumentScore",
			globalWidth : globalWidth,
			globalHeight : globalHeight,
			label : label,
			fileName : fileName,
			startPage : currentPage
		}

		for (key in pagesZoneData) {

			if (pagesZoneData[key].y >= 0)
				params[key] = pagesZoneData[key];

		}

		$.ajax({
			method : "POST",
			url : "imageUpload",
			data : params
		}).done(function(msg) {
			console.log(msg);

			$("#resultDiv").html("<button onclick='hideResultDiv()')>X</button><button onclick='downloadScore()')>download</button><BR><img src='data/" + msg + "' width='" + 600 + "' />");
			$("#resultDiv").css("visibility", "visible");
		}).fail(function(jqXHR, textStatus) {
			alert("Request failed: " + textStatus);
		});

	}

}
function downloadScore() {
	window.location.href = "data/" + downoladFileName

}
function setMessage(str) {
	$("#message").html(str);
}
function hideResultDiv() {
	$("#resultDiv").css("visibility", "hidden");
}