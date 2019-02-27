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
        console.log("loaded:", data);
        fishfries = L.geoJSON(data, {
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
            {
                data: "properties.venue_name"
            }, {
                data: "properties.venue_address"
            }, {
                data: "properties.website",
                render: function (data, type, row, meta) {
                    if (data) {
                        return '<a href="' + data + '" target="_blank">Website</a>';
                    } else {
                        return "";
                    }
                }
            }, {
                data: "properties.validated"
            }, {
                data: "properties.publish"
            }
        ],
        select: {
            style: "single",
            blurable: true
        },
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

    table.on("select", function (e, dt, type, indexes) {
        if (type === "row") {
            var row = table.rows(indexes).data();//.pluck('id');
            var feature = row['0'];
            // dynamically set the route for the edit button from selected row
            // route = "/contribute/fishfry/" + row.ffid;
            var route = Flask.url_for("load_fishfry", {
                ffid: feature.id
            });
            $(".editbutton").attr("disabled", false);
            $(".editbutton").attr("href", route);
            $(".editbutton").text(
                "Edit: " + feature.properties.venue_name
            );
            console.log(route);
        }
        // } else {
        //     $(".editbutton").attr("disabled", true);
        // }
    });

    table.on("deselect", function (e, dt, type, indexes) {
        if (type === "row") {
            $(".editbutton").attr("disabled", true);
            $(".editbutton").text(
                "Edit Selected Fish Fry"
            );
        }
    });

});