function createMap(){
    //create the map with map options
    var myMap = L.map('map',{
        center: [34.2, -111.6873],
        zoom: 7,
        maxZoom: 10,
        minZoom: 6, 
    });
    
    //Variables for County and state Layers
    var county = new L.geoJSON();
    var state = new L.geoJSON();
    
    //custom attribute for cirlce data variable, might not be best pratice
    var addToAtt = '<a href="https://reports.blm.gov/reports.cfm?application=LR2000">, BLM LR2000</a>';
    
    //call getData, getCountyBound and getStateBound function to load data to map
    getData(myMap);
    getCountyBound(myMap, county);
    getStateBound(myMap, state);
    
    //tried to add county layer to map on start up, chrome does not send layer to back
    //TODO: Look at a different method
    //county.addTo(myMap);
    //county.bringToBack();
    
    //set variable to limit panning to Arizona
    var southWest = L.latLng(31, -115.4),
    northEast = L.latLng(37.2, -108.5);
    var bounds = L.latLngBounds(southWest, northEast);
    
    //set bounds and animate the edge of panning area
    myMap.setMaxBounds(bounds);
    myMap.on('drag', function() {
        myMap.panInsideBounds(bounds, { animate: true });
    });
    
    
    //Map tiles streets and greyscale
    var streets = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'+addToAtt,
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1Ijoic2ZyYXppZXIiLCJhIjoiY2lzbDZmOXo1MDdtbjJ1cHUzZDFxMGpuayJ9.vyt9QGsmTezFJ1TtrI6Q2w'
    }).addTo(myMap); 
    
   var greyscale = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'+addToAtt,
        maxZoom: 18,
        id: 'mapbox.light',
        accessToken: 'pk.eyJ1Ijoic2ZyYXppZXIiLCJhIjoiY2lzbDZmOXo1MDdtbjJ1cHUzZDFxMGpuayJ9.vyt9QGsmTezFJ1TtrI6Q2w'
    }); 
    
    //setup layer control box
    //baseMaps
    var baseMaps = {
        "Streets": streets,
        "Grayscale": greyscale
    };
    
    //overlayMaps
    var overlayMaps = {
        "State Boundary": state,
        "County Boundary": county,
    };
    
    //Load layercontrol
    L.control.layers(baseMaps, overlayMaps).addTo(myMap);
    
    //move zoomcontrol to topright
    myMap.zoomControl.setPosition('topright');
    
    //when layers is added send behind the circles
    myMap.on("overlayadd",function(event){
        state.bringToBack();
        county.bringToBack();
    });
 };

//Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            
            //access feature properties
            var props = layer.feature.properties;
            
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            
            //set popup variable to new popup object
            var popup = new Popup(props, attribute, layer, radius);
            
            //bind popup to layer
            popup.bindToLayer();
            
            //update the legend 
            updateLegend(map, attribute);  
        };
    });
};

//function to Create sequence controls
function createSequenceControls(map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'//set to bottom left of screen
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');
            
            //add skip buttons
            $(container).append('<button class="skip" id="reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward">Skip</button>');
            
            
            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick pointerdown', function(e){
                L.DomEvent.stopPropagation(e);
            });   
            
            return container;
        }
    });
    
    //add a sequence Control
    map.addControl(new SequenceControl());
    
    //set slider attributes
    $('.range-slider').attr({
        max: 10,
        min: 0,
        value: 0,
        step: 1
        });
    
    //replace button content with images
    $('#reverse').html('<img src="img/backward.png">');
    $('#forward').html('<img src="img/forward.png">');
    
    //click listener for buttons
    $('.skip').click(function(){
        //get the old index value
        var index = $('.range-slider').val();
        
        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 10 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 10 : index;
            
        };

         //update slider value
        $('.range-slider').val(index);
        
        //pass new attribute to update symbols
        updatePropSymbols(map, attributes[index]);
        
    });

    //input listener for slider
    $('.range-slider').on('input', function(){
         //Step 6: get the new index value
        var index = $(this).val();
        //console.log(index);
        
        //pass new attribute to update symbols with current index value
        updatePropSymbols(map, attributes[index]);
    });
};

//function to create the legend
function createLegend(map, attributes){
    var LegendControl = L.Control.extend({//new control legend instince
        options: {
            position: 'bottomright' //bottom right of screen
        },
        //add to map
        onAdd: function (map){
            // create the control container with a particular class name
            var legend = L.DomUtil.create('div', 'legend-container');
            
            
            //add temporal legend div to container
            $(legend).append('<div id="temporal-legend">');
            
        
            //start attribute legend svg string
            var svg = '<svg id="attribute-legend width="160px" height="160px">';
            
            //array of circle names to base loop on
            var circles = {max: 15,
                           mean: 75, 
                           min: 145};
            
            //loop to add each circle and text to svg string
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle + 
                    '" fill="#003399" fill-opacity="0.8" stroke="#e6e6e6" cx="90"/>';
                
                //text string
                svg += '<text class = "legend-text" fill=#000099 id="' + circle + '-text" x="170" y="'+circles[circle]+'"></text>';
            };
            
            //close svg string
            svg += "</svg>";
            
            //add attribute legend svg to container
            $(legend).append(svg);
            
            return legend;
        }
    });
    
    //add control to map
    map.addControl(new LegendControl());
    
    //update legend 
    updateLegend(map, attributes[0]);   
};

//update lengend with new attribute
function updateLegend(map, attribute){
    
    //function level variables
    var year = attribute.split("r")[1];
    var content = "Number of Active Mining Claims in: <b>" + year;
    //console.log("in updateLegend: "+content);
    
    //replace legend content
    $('#temporal-legend').html(content);
    
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
    
    //loop to calculate size of circles
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);
        
        //assign the cy and r attributes
        $('#'+key).attr({
            cy: 149 - radius,
            r: radius
        });
        
        //add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " Claims");
    };
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;
    
    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });
    
    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//function for Popups
function Popup(properties, attribute, layer, radius){
    //add county to popup content string
    this.properties = properties;
    this.attribute = attribute;
    this.layer=layer;
    this.year =  attribute.split("r")[1];
    this.claim = this.properties[attribute];
    //set the content of the popup
    this.content = "<p><b><strong> " + this.properties.County+"</strong></p> <p><b>Number of Claims in "+ this.year+": </b>"+ properties[attribute] + "</p>";
        
    //bind to layer
    this.bindToLayer = function(){
        this.layer.bindPopup(this.content,{
            offset: new L.Point(0,-radius) 
        });
    }; 
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 1;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);
    
    //return to radius
    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
      //Determine which attribute to visualize with proportional symbols
    //var attribute = "yr2010";
    var attribute = attributes[0];
    
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    
    //check
    //console.log(attribute);
    
    //create marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#003399",
        color: "#ffffff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
    };
    
    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
        
    //examine the attribute value to check that it is correct
    //console.log(feature.properties, attValue);
        
    //Give each feature's circle marker a radius based on its attribute value
    geojsonMarkerOptions.radius = calcPropRadius(attValue);
        
    //create cricle markers
    var layer=L.circleMarker(latlng, geojsonMarkerOptions);
    
    //createPopup(feature.properties, attribute, layer,  geojsonMarkerOptions.radius);
    var popup = new Popup(feature.properties, attribute, layer, geojsonMarkerOptions.radius) 
    
    popup.bindToLayer();
    
    //event listeners to open popup on hover
      /*layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
      click: function(){
            $("#panel").html(panelContent);
            console.log("in click function")
        }
    });*/
        
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
    
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){

    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature,latlng,attributes);
        } 
           
    }).addTo(map);
};

//build an attributes array from the data
function processData(data){
    
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    
    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with year values
        if (attribute.indexOf("yr") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    //console.log(attributes);

    return attributes;
};

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    $.ajax("data/arizonaClaimsPerCounty.geojson", {
        dataType: "json",
        success: function(response){
            
            //create an attributes array
            var attributes = processData(response);
            
            //call function to create proportional symbols
            createPropSymbols(response, map, attributes);
            
            //call sequence control function
            createSequenceControls(map, attributes);
            
            //call create legend function
            createLegend(map, attributes);
        } 
    });      
};

/*Tried to do a label on the county lines but did not look good
function onEachFeature(feature, layer) {
    var toolTipText="";
    toolTipContent = feature.properties.NAME;
    console.log(toolTipContent);
    layer.bindTooltip(toolTipContent,{
        permanent: true,
        sticky: true,
        opacity: 0.8
    }).openTooltip;
};
*/

//create symbol for county boundary
function createCountySymbol(data,county){
    //style options
    var countyOptions = {
        fillColor:'#ffffff',
        fillOpacity:0,
        color:'grey',
        borderWidth:.25,
        opacity:0.6,   
    };
    //create layer 
     var geojsonLayer = L.geoJSON(data,{
        style: countyOptions,
    });
    
    //add county layer
    county.addLayer(geojsonLayer);  
};

//load the state boundary geojson data
function getCountyBound(map, county){
    $.ajax("data/AZCountiesBound.geojson",{
        dataType:"json",
        success: function(response){
          createCountySymbol(response, county);    
        }
    });
};

// create the state boundary layer
function createStateSymbol(data,state){
    // style options
    var stateOptions = {
        fillColor:'#ffffff',
        fillOpacity:0,
                color:'black',
                opacity:0.5,
    };
    //create layer
     var geojsonLayer = L.geoJSON(data,{
        style: stateOptions,
    });
    //add layer
    state.addLayer(geojsonLayer);
};

//load the state boundary geojson data
function getStateBound(map, state){
    $.ajax("data/AZStateBound.geojson",{
        dataType:"json",
        success: function(response){
          createStateSymbol(response, state);   
        }
    });
};

//load the map when ready
$(document).ready(createMap);
