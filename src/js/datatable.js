var $ = jQuery;
require("datatables.net-bs")(window, $);
require("datatables.net-buttons-bs")(window, $);
require("datatables.net-select-bs")(window, $);
var L = require("leaflet");

$(function () {
    var map, fishfries;

    map = new L.Map("map", {
        center: [40.440734, -80.0091294],
        zoom: 10
    });

    $.getJSON(Flask.url_for("api") + "fishfries/", function (data) {
        console.log(data);
        var fishfries = L.geoJSON(data, {
            style: function (feature) {
                if (feature.properties.publish && feature.properties.validated) {
                    return { color: "#FCB82E" };
                } else if (feature.properties.publish || feature.properties.validated) {
                    return { color: "#0000ff" };
                } else {
                    return { color: "#ff0000" };
                }
            },
            pointToLayer: function (point, latlng) {
                return L.circleMarker(latlng, {});
            },
            onEachFeature: function (feature, layer) {
                var p = feature.properties;
                var edit_link = Flask.url_for("load_fishfry", { ffid: feature.id });
                layer.bindPopup(
                    L.Util.template(
                        "<h3>{0}</h3><h5>{1}</h5><p>Validated?: {2}<br>Published?: {3}</p><p><a href='{4}'>Edit This &rarr;</a></p>", {
                            0: p.venue_name,
                            1: p.venue_address,
                            2: p.validated,
                            3: p.publish,
                            4: edit_link
                        }
                    )
                );
            }
        });
        fishfries.addTo(map);
    });

    L.tileLayer(
        "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: 'Tiles via <a href="http://carto.com">Carto</a>. Basemap data from <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a> license.'
        }
    ).addTo(map);
});

// window.onload = function() {
//     makeMap();
// };

/**
 * create the dataTable from the API Response
 */
$(document).ready(function () {
    $(".editbutton").click(function () {
        var row = table.row(".selected").data();
        console.log(row.ffid);
    });

    var table = $("#data-table").DataTable({
        processing: true,
        dom: "lfrtip",
        ajax: {
            url: Flask.url_for("api") + "fishfries/",
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

    $("#data-table").on("click", "tr", function () {
        if ($(this).hasClass("selected")) {
            var row = table.row(".selected").data();
            console.log(row);
            // dynamically set the route for the edit button from selected row
            // route = "/contribute/fishfry/" + row.ffid;
            var route = Flask.url_for("load_fishfry", {
                ffid: row.id
            });
            console.log(route);
            $(".editbutton").attr("disabled", false);
            $(".editbutton").attr("href", route);
            $(".editbutton").text(
                "Edit Selected Fish Fry (" + row.properties.venue_name + ")"
            );
        } else {
            $(".editbutton").attr("disabled", true);
        }
    });

    // var table = $("#data-table-completed").DataTable({
    //     processing: true,
    //     dom: "lfrtip",
    //     ajax: {
    //         url: Flask.url_for("api") + "fishfries/",
    //         type: "GET",
    //         dataSrc: "features"
    //     },
    //     deferRender: true,
    //     columns: [
    //         { data: "properties.venue_name" },
    //         { data: "properties.venue_address" },
    //         { data: "properties.validated" },
    //         { data: "properties.publish" }
    //     ],
    //     select: true,
    //     // select: {
    //     //     // style: "single",
    //     //     style: "os",
    //     //     blurable: true
    //     // },
    //     buttons: [{
    //         extend: "selected",
    //         text: "Edit Selected Fish Fry"
    //             // action: function(e, dt, button, config) {
    //             //     //alert( dt.rows( { selected: true } ).indexes().length +' row(s) selected' );
    //             //     var x = dt.rows({ selected: true }).data();
    //             //     console.log(JSON.stringify(x[0].cartodb_id));
    //             // }
    //     }]
    // });

    // $("#data-table").on("click", "tr", function() {
    //     if ($(this).hasClass("selected")) {
    //         var row = table.row(".selected").data();
    //         console.log(row);
    //         // dynamically set the route for the edit button from selected row
    //         // route = "/contribute/fishfry/" + row.ffid;
    //         var route = Flask.url_for("load_fishfry", {
    //             ffid: row.id,
    //             validated: true,
    //             publish: true
    //         });
    //         console.log(route);
    //         $(".editbutton").attr("disabled", false);
    //         $(".editbutton").attr("href", route);
    //         $(".editbutton").text(
    //             "Edit Selected Fish Fry (" + row.properties.venue_name + ")"
    //         );
    //     } else {
    //         $("#editbutton").attr("disabled", true);
    //     }
    // });
});