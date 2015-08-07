//making Leaflet tileLayers with Mapbox.
L.mapbox.accessToken = 'pk.eyJ1IjoieW9uZ2NobzgyMiIsImEiOiIzZDBmYmMwYTQ3MzMyOWNhYTU0ZDM1ZGZhYjE3YjE3ZiJ9.OU3Ih_GF4sHHVSt__RCAZA';
var mapboxTiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=' + L.mapbox.accessToken, {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
    });

var map = L.map('map', {zoomControl: true})
    //instead of .addLayer, could've instead done .addTo(map) after the L.tileLayer (not setting it as a variable)
    .addLayer(mapboxTiles)
    //centering the map at startup. zoom level is 13.
    .setView([41.8880, -87.637855], 12);
// Disable drag and zoom handlers.
// map.dragging.disable();
// map.touchZoom.disable();
// map.doubleClickZoom.disable();
// map.scrollWheelZoom.disable();

// Disable tap handler, if present.
if (map.tap) map.tap.disable();

var width = 600,
    height = 626,
    width2 = 602,
    height2 = 634;

var probe,
    hoverData;

var sliderScale, slider;

var sliderMargin = 65;

//making orderedColumns array to populate with hourly data.
var orderedColumns = [],
    currentFrame = 0,
    frameLength = 1250,
    isPlaying = false,
    interval

var svg = d3.select(map.getPanes().overlayPane).append("svg").attr('width', 1000).attr('height', 1000),
    // svg2 = d3.select(map.getPanes().overlayPane).append("svg").attr('width', 1300).attr('height', 1300),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

probe = d3.select("#map").append("div")
    .attr("id","probe");

//reading in the data! beginning of callback function.
d3.csv("https://s3.amazonaws.com/divvyfolder/ready.csv",function(data){
    var first = data[0];
    //making columns for every hour.
    for ( var col in first ){
      if ( col != "station_name" && col != "latitude" && col != "longitude" ){
        orderedColumns.push(col);
      }
    }

    // draw station points -- this works!
    reset(data);
  
    createSlider();

    drawHour( orderedColumns[currentFrame] ); // initial map

    // createLegend();

    window.onresize = resize;
    resize();

    var cheat_function = function() { reset(data); drawHour( orderedColumns[currentFrame] )};

    map.on("viewreset", cheat_function);

    d3.select("#play")
      .attr("title","Play animation")
      .on("click",function(){
        if ( !isPlaying ){
          isPlaying = true;
          d3.select(this).classed("pause",true).attr("title","Pause animation");
          animate();
        } else {
          isPlaying = false;
          d3.select(this).classed("pause",false).attr("title","Play animation");
          clearInterval( interval );
        }
       });
});
//end of callback function


//listing functions.
function reset(data) {
    for ( var i in data ){
        var location = map.latLngToLayerPoint(new L.LatLng(data[i].latitude, data[i].longitude))
        data[i]['x'] = location.x;
        data[i]['y'] = location.y;
    }

    g.selectAll('circle').remove();

    g.selectAll('circle')
        .data(data).enter()
        .append('circle')
        .attr("cx",function(d) { return d.x; })
        .attr("cy",function(d) { return d.y; })
        .attr("r",3)
        .attr("vector-effect","non-scaling-stroke")
        .on("mousemove",function(d){
          hoverData = d;
          setProbeContent(d);
          probe
            .style( {
              "display" : "block",
              "top" : (d3.event.pageY - 30) + "px",
              "left" : (d3.event.pageX + 5) + "px"
            })
        })
        .on("mouseout",function(){
          hoverData = null;
          probe.style("display","none");
        })
  }

function circleSize(d){
  //use 0.25
  return Math.sqrt( 0.25 * Math.abs(d) );
}

//coming up with the mouse-over pop-up box.
function setProbeContent(data){
  var val = data[ orderedColumns[ currentFrame ] ];
  var html = "<strong>" + data.station_name + "</strong>";
            // + format( Math.abs( val ) ) + " jobs " + ( val < 0 ? "lost" : "gained" ) + "<br/>" +
            // "<span>" + month + " " + m_y[1] + "</span>";
  probe
    .html( html );
}

//what actually brings the circles onto the maps for each hour.
function drawHour(h,between){
  var circle = g.selectAll("circle")

    .attr("class",function(d){
      return d[h] > 0 ? "gain" : "loss";
    })
  if ( between ){
    circle
      .transition()
      .ease("linear")
      .duration(frameLength)
      .attr("r",function(d){
        return circleSize(d[h])
      });
  } else {
    circle.attr("r",function(d){
      return circleSize(d[h])
    });
  }
}

function createSlider(){

  sliderScale = d3.scale.linear().domain([0,orderedColumns.length-1]);

  var val = slider ? slider.value() : 0;

  slider = d3.slider()
                .scale(sliderScale)
                .axis(d3.svg.axis().ticks(23))
                .min(0)
                .max(23)
                .step(1)
                // .ticks(23)
                .on("slide",function(event,value){
                  if ( isPlaying ){
                    clearInterval(interval);
                  }
                  currentFrame = value;
                  drawHour( orderedColumns[value], d3.event.type != "drag" );
                })
                         
   return d3.select('#slider-div').call(slider);

}

function animate(){
  //setInterval works by specifying a function to execute, and then the time interval
  interval = setInterval(function(){
    currentFrame++;

    // console.log(currentFrame)

    if ( currentFrame == orderedColumns.length ) currentFrame = 0;

    d3.select("#slider-div .d3-slider-handle")
      .style("left", 105*currentFrame/orderedColumns.length + "%" );
    slider.value(currentFrame)

    drawHour(currentFrame,true);

    if ( currentFrame == orderedColumns.length - 1 ){
      isPlaying = false;
      d3.select("#play").classed("pause",false).attr("title","Play animation");
      
      //setInterval() returns an interval ID, which we can pass to clearInterval() to stop calling on currentFrame++
      clearInterval(interval);
      return;
    }
    //framelength is the number of milliseconds (500 in this case) that the setInterval() function should wait before each call to func.
  },frameLength);
}

function createLegend(){
  var legend = svg.append("g").attr("id","legend").attr("transform","translate(560,10)");

  legend.append("circle").attr("class","loss").attr("r",5).attr("cx",-65).attr("cy",10)
  legend.append("circle").attr("class","gain").attr("r",5).attr("cx",-65).attr("cy",30)

  legend.append("text").text("bike net outflow").attr("x",-55).attr("y",13);
  legend.append("text").text("bike net inflow").attr("x",-55).attr("y",33);
}

function resize(){
  var w = d3.select("#map").node().offsetWidth,
      h = window.innerHeight - 80;
  var scale = Math.max( 1, Math.min( w/width, h/height ) );
  svg
    .attr("width",width*scale)
    .attr("height",height*scale);
  g.attr("transform","scale(" + scale + "," + scale + ")");

  // var w2 = d3.select("#container").node().offsetWidth,
  //     h2 = window.innerHeight - 80;
  // var scale2 = Math.max( 1, Math.min( w2/width2, h2/height2 ) );

  // document.getElementById('container').style.width = 'width2*scale2';
  // document.getElementById('container').style.height = 'height2*scale2';
  // document.getElementById('container').setAttribute("scale(" + scale2 + "," + scale2 + ")"));

  // g2.attr("transform","scale(" + scale2 + "," + scale2 + ")");

}