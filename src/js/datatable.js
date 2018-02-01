var $ = jQuery;
require('datatables.net-bs')(window, $);
require('datatables.net-buttons-bs')(window, $);
require('datatables.net-select')(window, $);
var L = require("leaflet");

function makeMap() {
    var map = new L.Map('map', {
        center: [40.440734, -80.0091294],
        zoom: 10
    });
    /*L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
      attribution: 'Stamen'
    }).addTo(map);
    */
    L.tileLayer(
        //'http://{s}.sm.mapstack.stamen.com/((toner-lite,$000%5B@80%5D,$8ad3f4%5Bhsl-color%5D,mapbox-water%5Bdestination-in%5D),(toner,$fff%5Bdifference%5D,$fdb930%5Bhsl-color%5D,mapbox-water%5Bdestination-out%5D),(toner-hybrid,$fff%5Bdifference%5D,$fdb930%5Bhsl-color%5D),(terrain-background,$000%5B@40%5D,$ffffff%5Bhsl-color%5D,mapbox-water%5Bdestination-out%5D)%5Blighter@40%5D)/{z}/{x}/{y}.png',
        //'http://{s}.sm.mapstack.stamen.com/((terrain-background,$000[@30],$fff[hsl-saturation@80],$b2c4cc[hsl-color],mapbox-water[destination-in]),(watercolor,$fff[difference],$808080[hsl-color],mapbox-water[destination-out]),(terrain-background,$000[@40],$ffffff[hsl-color],mapbox-water[destination-out])[screen@60],(streets-and-labels,$fedd9a[hsl-color])[@50])/{z}/{x}/{y}.png',
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: 'Tiles via <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> license. Basemap data from <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a> license.',
        }
    ).addTo(map);

}

window.onload = function() {
    makeMap();
};

/**
 * create the dataTable from the API Response
 */
$(document).ready(function() {
    var table = $("#data-table").DataTable({
        processing: true,
        dom: "lfrtip",
        ajax: {
            url: Flask.url_for('api') + 'fishfries/',
            type: "GET",
            dataSrc: "features"
        },
        deferRender: true,
        columns: [
            { data: "properties.venue_name" },
            { data: "properties.venue_address" },
            { data: "properties.validated" },
            { data: "properties.publish" }
        ],
        select: true,
        // select: {
        //     // style: "single",
        //     style: "os",
        //     blurable: true
        // },
        buttons: [{
            extend: "selected",
            text: "Edit Selected Fish Fry"
                // action: function(e, dt, button, config) {
                //     //alert( dt.rows( { selected: true } ).indexes().length +' row(s) selected' );
                //     var x = dt.rows({ selected: true }).data();
                //     console.log(JSON.stringify(x[0].cartodb_id));
                // }
        }]
    });

    $("#data-table").on("click", "tr", function() {
        if ($(this).hasClass("selected")) {
            var row = table.row(".selected").data();
            console.log(row);
            // dynamically set the route for the edit button from selected row
            // route = "/contribute/fishfry/" + row.ffid;
            var route = Flask.url_for('edit_fishfry', { "ffid": row.ffid });
            console.log(route);
            $("#editbutton").attr("disabled", false);
            $("#editbutton").attr("href", route);
            $("#editbutton").text("Edit Selected Fish Fry (" + row.properties.venue_name + ")");
        } else {
            $("#editbutton").attr("disabled", true);
        }
        /*
        if ( $(this).hasClass('selected') ) {
            $(this).removeClass('selected');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
        */
    });

    $("#editbutton").click(function() {
        var row = table.row(".selected").data();
        console.log(row.ffid);
    });

    // var tableCompleted = $("#data-table-completed").DataTable({
    //     processing: true,
    //     dom: "lfrtip",
    //     ajax: {
    //         url: Flask.url_for('api') + '/fishfries',
    //         type: "GET",
    //         dataSrc: "rows"
    //     },
    //     deferRender: true,
    //     columns: [
    //         { data: "properties.venue_name" },
    //         { data: "properties.venue_address" },
    //         { data: "properties.validated" },
    //         { data: "properties.publish" },
    //         { data: "properties.cartodb_id" }
    //     ],
    //     select: {
    //         style: "single",
    //         blurable: true
    //     },
    //     buttons: [{
    //         extend: "selected",
    //         text: "Edit Selected Fish Fry"
    //             /*
    //             action: function (e, dt, button, config) {
    //                 //alert( dt.rows( { selected: true } ).indexes().length +' row(s) selected' );
    //                 var x = dt.rows({ selected: true }).data();
    //                 console.log(JSON.stringify(x[0].cartodb_id));
    //             }
    //             */
    //     }]
    // });

    // $("#data-table-completed").on("click", "tr", function() {
    //     if ($(this).hasClass("selected")) {
    //         var row = tableCompleted.row(".selected").data();
    //         //console.log(row.cartodb_id);
    //         route = "/contribute/fishfry/" + row.cartodb_id;
    //         $("#editbutton-completed").attr("disabled", false);
    //         $("#editbutton-completed").attr("href", route);
    //         $("#editbutton-completed").text(
    //             "Edit Selected Fish Fry (" + row.cartodb_id + ")"
    //         );
    //     } else {
    //         $("#editbutton-completed").attr("disabled", true);
    //     }
    //     /*
    //     if ( $(this).hasClass('selected') ) {
    //         $(this).removeClass('selected');
    //     }
    //     else {
    //         table.$('tr.selected').removeClass('selected');
    //         $(this).addClass('selected');
    //     }
    //     */
    // });

    // $("#editbutton-completed").click(function() {
    //     var row = tableCompleted.row(".selected").data();
    //     console.log(row.cartodb_id);
    // });
});