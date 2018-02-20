/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

function getData(map){
    //load the data
    $.ajax("data/MegaCitiesQGIS.geojson", {
        dataType: "json",
        success: function(response){
            //create a Leaflet GeoJson layer
            var geoJsonLayer = L.geoJson(response);
            //create a L.markerClusterGroup Layer
            var markers = L.markerClusterGroup();
            //add geoJason to marker cluster layer
            markers.addLayer(geoJsonLayer);
            //add MarkerClusterGroup to map
            map.addLayer(markers);
        }
    });
};


$(document).ready(createMap);