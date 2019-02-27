var $ = jQuery;
require("datatables.net-bs")(window, $);
require("datatables.net-buttons-bs")(window, $);
require("datatables.net-select-bs")(window, $);
var L = require("leaflet");

$(function () {

    var map, fishfryLayer, fishfryTable, refMunis;

    /** -----------------------------------------
     * MAP SETUP
     */
    map = new L.Map("map", {
        center: [40.440734, -80.0091294],
        zoom: 10
    });

    L.tileLayer(
        "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: 'Tiles via <a href="http://carto.com">Carto</a>. Basemap data from <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a> license.'
        }
    ).addTo(map);

    // $.getJSON("http://services1.arcgis.com/jOy9iZUXBy03ojXb/arcgis/rest/services/PennDOTBoundaries_v_2/FeatureServer/2/query?where=1%3D1&f=pgeojson&outSR=4326", (data) => {
    //     console.log("get")
    //     refMunis = L.geoJSON(data, {}).addTo(map);
    // })


    /** -----------------------------------------
     * LOAD DATA
     * get the fish fry data and add it to the map and table
     */

    $.getJSON(Flask.url_for("api") + "fishfries/", function (data) {

        console.log("loaded:", data);

        // --------------------------------------
        // FISH FRY map layer

        fishfryLayer = L.geoJSON(data, {
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
        }).addTo(map);

        var lookupLayerIdFfid = {}
        var lookupFfidLayerId = {}
        Object.keys(fishfryLayer._layers).forEach((k) => {
            lookupLayerIdFfid[k] = fishfryLayer._layers[k].feature.id;
            lookupFfidLayerId[fishfryLayer._layers[k].feature.id] = k;
        });

        // --------------------------------------
        // FISH FRY data table

        fishfryTable = $("#data-table").DataTable({
            processing: true,
            dom: "lfrtip",
            data: data.features,
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
                style: "single"
                // blurable: true
            },
            buttons: [{
                extend: "selected",
                text: "Edit Selected Fish Fry"
            }]
        });

        fishfryTable.on("select", function (e, dt, type, indexes) {
            if (type === "row") {

                // enable the edit button 

                var row = fishfryTable.rows(indexes).data();//.pluck('id');
                var feature = row['0'];
                $(".editbutton").attr("disabled", false);
                $(".editbutton").attr("href", Flask.url_for("load_fishfry", {
                    ffid: feature.id
                }));
                $(".editbutton").text(
                    "Edit: " + feature.properties.venue_name
                );

                // open the map popup
                map._layers[lookupFfidLayerId[feature.id]].fire('click');

            }
        });

        fishfryTable.on("deselect", function (e, dt, type, indexes) {
            if (type === "row") {

                // disable edit button

                $(".editbutton").attr("disabled", true);
                $(".editbutton").text(
                    "Edit Selected Fish Fry"
                );

                // deselect on the map
                map.closePopup();
            }
        });

    });

});