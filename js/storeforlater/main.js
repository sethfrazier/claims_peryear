//initialize function called when the script loads
function initialize(){
    cities();
};

//function to create a table with cities and their populations
function cities(){
    //define two arrays for cities and population
    var cityPop = [
        { 
            city: 'Madison',
            population: 233209
        },
        {
            city: 'Milwaukee',
            population: 594833
        },
        {
            city: 'Green Bay',
            population: 104057
        },
        {
            city: 'Superior',
            population: 27244
        }
    ];

    //append the table element to the div
    $("#mydiv").append("<table>");

    //append a header row to the table
    $("table").append("<tr>");

    //add the "City" and "Population" columns to the header row
    $("tr").append("<th>City</th><th>Population</th>");

    //loop to add a new row for each city
    for (var i = 0; i < cityPop.length; i++){
        //assign longer html strings to a variable
        var rowHtml = "<tr><td>" + cityPop[i].city + "</td><td>" + cityPop[i].population + "</td></tr>";
        //add the row's html string to the table
        $("table").append(rowHtml);
    };


//Added at Example 3.5 line 44...
    //get the div id
    var theid = $('#mydiv').attr('id');

    //theid is 'mydiv'; add it as text to the div
    $('#mydiv').append(theid);

    //add the class 'foo' to the div
    $('#mydiv').attr('class', 'foo');

    //Check your work with the Inspector!

//Added below Example 3.6...
    //change the text color
    $('#mydiv').css('color', 'red');

    //change the text size and alignment
    $('#mydiv').css({
        'font-size': '2em',
        'text-align': 'left'
    });

    //get the text color and add it as text to the div
    var thecolor = $('#mydiv').css('color');
    $('#mydiv').append(thecolor);

    //fooled ya! thecolor is rgb(255, 0, 0), the CSS interpreter's translation of the keyword 'red'

//Added below Example 3.7...
    //iterate over each script element and add each one's source url as text to the div
    $('script').each(function(){
        var thesource = $(this).attr('src');
        $('#mydiv').append(thesource);
    });
    
    //Added below Example 3.8...
    //click listener with anonymous handler function
    $('table').on('click', function(){
        alert('Madison Rocks! Go Badgers!');
    });

    //alias method for the click event listener
    $('table').click(function(){
        alert('Visit Superior and see the big lake!');
    });

    //named handler function for removable listener
    function clickme(){
        alert('Yeah Green Bay! Go Packers!');
    };

    //add the event listener
    $('table').on('click', clickme);

    //remove the event listener
    $('table').off('click', clickme);
    
};

//call the initialize function when the document has loaded
$(document).ready(initialize);