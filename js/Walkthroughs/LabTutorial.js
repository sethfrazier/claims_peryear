function createMap(){
    //create the map
    var mymap = L.map('map',{
        center: [34.2, -111.6873],
        zoom: 7,
        zoomControl: false 
    });
    
    var streets = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1Ijoic2ZyYXppZXIiLCJhIjoiY2lzbDZmOXo1MDdtbjJ1cHUzZDFxMGpuayJ9.vyt9QGsmTezFJ1TtrI6Q2w'
    }),
        topo = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(mymap);
    
    var baseMaps = {
    "Topo": topo,
    "Streets": streets
    };
    
    mymap.addControl( new L.Control.Search({sourceData: searchBar}) );
    
    //var searchLayer = L.layerGroup().addTo(mymap);
    
    //call getData function to load data to map
    getData(mymap);
 
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            
            //access feature properties
            var props = layer.feature.properties;
            
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            //var popupContent = "<p><b>County:</b> " + props.County + "</p>";
            
            //add formatted attribute to panel content string
            //var year = attribute.split("r")[1];
            //popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + "</p>";
            
            //replace the layer popup
            //layer.bindPopup(popupContent, {
            //    offset: new L.Point(0,-radius)
            //});
            
            var popup = new Popup(props, attribute, layer, radius);
            
            popup.bindToLayer();
            
            updateLegend(map, attribute);
            
        };
    });
};

//Create new sequence controls
function createSequenceControls(map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
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
    map.addControl(new SequenceControl());
    
    //set slider attributes
    $('.range-slider').attr({
        max: 10,
        min: 0,
        value: 0,
        step: 1
        });
    
    //Below Example 3.5...replace button content with images
    $('#reverse').html('<img src="img/backward.png">');
    $('#forward').html('<img src="img/forward.png">');
    
     //Below Example 3.6 in createSequenceControls()
    //Step 5: click listener for buttons
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

         //Step 8: update slider
        $('.range-slider').val(index);
        console.log(index)
        //Step 9: pass new attribute to update symbols
        updatePropSymbols(map, attributes[index]);
        
    });

    //Step 5: input listener for slider
    $('.range-slider').on('input', function(){
         //Step 6: get the new index value
        var index = $(this).val();
        console.log(index);
        
        //Step 9: pass new attribute to update symbols
        updatePropSymbols(map, attributes[index]);
    });
    
        
};

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        
        onAdd: function (map){
            // create the control container with a particular class name
            var legend = L.DomUtil.create('div', 'legend-container');
            
            
            //add temporal legend div to container
            $(legend).append('<div id="temporal-legend">');
            
        
            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend width="160px" height="160px">';
            
            //array of circle names to base loop on
            var circles = {max: 15,
                           mean: 75, 
                           min: 145};
            
            //Step 2: loop to add each circle and text to svg string
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle + 
                    '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="90"/>';
                
                //text string
                svg += '<text id="' + circle + '-text" x="170" y="'+circles[circle]+'"></text>';
            };
            
            //close svg string
            svg += "</svg>";
            
            //add attribute legend svg to container
            $(legend).append(svg);
            
            return legend;
            
        }
        
        
    });
  
    map.addControl(new LegendControl());
    updateLegend(map, attributes[0]); 
    
};
//update lengend with new attribute
function updateLegend(map, attribute){
    var year = attribute.split("r")[1];
    var content = "Year: " + year;
    console.log("in updateLegend: "+content);
    
    //replace legend content
    $('#temporal-legend').html(content);
    
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
    
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);
        
        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 149 - radius,
            r: radius
        });
        
        //Step 4: add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " million");
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
    
/*
//Step 1: Create new sequence controls
function createSequenceControls(map, attributes){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');
    
    //set slider attributes
    $('.range-slider').attr({
        max: 10,
        min: 0,
        value: 0,
        step: 1
    });
     $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
    $('#panel').append('<button class="skip" id="forward">Skip</button>');
    
    //Below Example 3.5...replace button content with images
    $('#reverse').html('<img src="img/leftarrow.png">');
    $('#forward').html('<img src="img/rightarrow.png">');
    
    //Below Example 3.6 in createSequenceControls()
    //Step 5: click listener for buttons
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

         //Step 8: update slider
        $('.range-slider').val(index);
        console.log(index)
        //Step 9: pass new attribute to update symbols
        updatePropSymbols(map, attributes[index]);
        
    });

    //Step 5: input listener for slider
    $('.range-slider').on('input', function(){
         //Step 6: get the new index value
        var index = $(this).val();
        console.log(index);
        
        //Step 9: pass new attribute to update symbols
        updatePropSymbols(map, attributes[index]);
    });
    
    
    
};
*/

function Popup(properties, attribute, layer, radius){
    //add county to popup content string
    this.properties = properties;
    this.attribute = attribute;
    this.layer=layer;
    this.year =  attribute.split("r")[1];
    this.claim = this.properties[attribute];
    this.content = "<p><b>County:</b> " + this.properties.County+"</p> <p><b>Number of Claims in "+ this.year+":</b>"+ properties[attribute] + " mn</p>";
    
     var popupContent = "<p><b>County:</b> " + properties.County+"</p>";
    
    //add formated attribute to panel content string
    
    var year = attribute.split("r")[1];
        popupContent += "<p><b>Number of Claims in "+ year+":</b>"+ properties[attribute] + " mn</p>";
    
    //replace the layer popup
    //layer.bindPopup(popupContent,{
    //    offset: new L.Point(0,-radius)
    //    });
        
        this.bindToLayer = function(){
            this.layer.bindPopup(this.content,{
               offset: new L.Point(0,-radius) 
            });
        };
    
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 1;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
      //Determine which attribute to visualize with proportional symbols
    //var attribute = "yr2010";
    var attribute = attributes[0];
    
    //Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    //check
    console.log(attribute);
    
    //create marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    
    //For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);
        
        //examine the attribute value to check that it is correct
            console.log(feature.properties, attValue);
        
        //Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);
        
        //create cricle markers
            var layer=L.circleMarker(latlng, geojsonMarkerOptions);
        
        //build popup content string starting with county
        //var popupContent = "<p><b>County:</b> " + feature.properties.County+"</p>";
    
        //original popupContent changed to panelContent
        //var panelContent = "<p><b>County:</b> " +
        //    feature.properties.County+"</p>";
    
        //add formatted attribute to popup content string
        //var year = attribute.split("r")[1];
        //popupContent += "<p><b>Number of Claims in "+ year+":</b>"+ feature.properties[attribute] + " //mn</p>";
    
        //panelContent += "<p><b>Number of Claims in "+ year+":</b>"+ //feature.properties[attribute] + " mn</p>";
    
        //popup content is now just the county name
        //var popupContent = feature.properties.County;
    
    
    
      //bind the popup to the circle marker
    //layer.bindPopup(popupContent,{
    //    offset: new L.Point(0,-geojsonMarkerOptions.radius)
            
    //});
    
    //createPopup(feature.properties, attribute, layer,  geojsonMarkerOptions.radius);
    var popup = new Popup(feature.properties, attribute, layer, geojsonMarkerOptions.radius) 
    
    popup.bindToLayer();
    
    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        /*click: function(){
            $("#panel").html(panelContent);
            console.log("in click function")
        }*/
    });
        
        //return the circle marker to the L.geoJson pointToLayer option
    return layer;
    
};

function searchBar(data, map, attributes){
    var featureLayer = L.geoJson(data,{
        
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature,latlng,attributes)
        }
    });
        
    var searchControl = new L.Control.Search({
        layer: featureLayer,
        propertyName: 'County',
    });
    
    return searchControl
        
     
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

//Above Example 3.8...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("yr") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

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
            createSequenceControls(map, attributes);
            createLegend(map, attributes);
            }
         
    });
};


$(document).ready(createMap);

/*function debugAjax(){
	
	console.log("debugging is running")

	$.ajax("data/MegaCitiesQGIS.geojson", {
		dataType: "json",
		success: debugCallback
	});
	
};

function debugCallback(response){
   
	$('#mydiv').append('GeoJSON data: ' + JSON.stringify(response));
	
};

(document).ready(debugAjax);*/
