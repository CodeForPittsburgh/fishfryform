var $ = jQuery;
require("datatables.net-bs")(window, $);
require("datatables.net-buttons-bs")(window, $);
require("datatables.net-select-bs")(window, $);
var L = require("leaflet");

$(function () {

  // map things
  var map, fishfryLayer, refMunis, refChurches
  // table things
  var fishfryTable;
  // map-to-table things
  var lookupLayerIdFfid, lookupLayerIdFfid

  /** -----------------------------------------
   * MAP SETUP
   */
  map = new L.Map("map", {
    center: [40.440734, -80.0091294],
    zoom: 10
  });

  var layerControl = L.control.layers({}, {}, { position: "bottomleft" }).addTo(map);

  L.tileLayer(
    "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: 'Tiles via <a href="http://carto.com">Carto</a>. Basemap data from <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a> license.'
    }
  ).addTo(map);

  $.getJSON("https://services1.arcgis.com/vdNDkVykv9vEWFX4/ArcGIS/rest/services/Catholic_Churches_in_Allegheny_County/FeatureServer/0/query?where=1%3D1&outFields=name%2Curl%2Cphone_number%2Cemail&returnGeometry=true&outSR=4326&f=pgeojson", (data) => {
    refChurches = L.geoJSON(data, {
      pointToLayer: function (pt, latlng) {
        return L.circleMarker(latlng, {
          radius: 3,
          weight: 1,
          color: "#666"
        }).bindPopup(
          L.Util.template(
            "<h5>{0}</h5><p><a href='{1}' target='_blank'>website&rarr;</a></p><p>email: {2}<br>phone: {3}</p>", {
              0: pt.properties.name,
              1: pt.properties.url,
              2: pt.properties.email,
              3: pt.properties.phone_number
            }
          )
        );
      }

    }).setZIndex(350).addTo(map);
    // refChurches.setZIndex(350);
    layerControl.addOverlay(refChurches, "Churches");
  })

  $.getJSON("https://opendata.arcgis.com/datasets/9de0e9c07af04e638dbc9cb9070962c2_0.geojson", (data) => {
    refMunis = L.geoJSON(data, {
      style: function (feature) {
        return {
          weight: 1.5,
          color: '#777777',
          opacity: 0.4,
          fillColor: '#777777',
          fillOpacity: 0.1
        };
      },
      onEachFeature: function (ft, lyr) {
        lyr.bindPopup("<em class='small'>" + ft.properties.LABEL + "</em>", { opacity: 0.8 })
      }
    }).setZIndex(250).addTo(map);
    layerControl.addOverlay(refMunis, "Municipalities");
  })



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
          return {
            color: "#325D88"
          };
        } else if (feature.properties.publish || feature.properties.validated) {
          return {
            color: "#FCB82E"
          };
        } else {
          return {
            color: "#D9534F"
          };
        }
      },
      pointToLayer: function (point, latlng) {
        return L.circleMarker(latlng, {});
      },
      onEachFeature: function (feature, layer) {
        // some vars
        var p = feature.properties;
        var edit_link = Flask.url_for("load_fishfry", {
          ffid: feature.id
        });

        // POPUP
        if (p.website) {
          layer.bindPopup(
            L.Util.template(
              "<h3>{0}</h3><h5>{1}</h5><p><a href={5} target='_blank'>Go to Venue Website &rarr;</a></p><p>Validated?: {2}<br>Published?: {3}</p><p><a href='{4}'>Edit This &rarr;</a></p>", {
                0: p.venue_name,
                1: p.venue_address,
                2: p.validated,
                3: p.publish,
                4: edit_link,
                5: p.website
              }
            )
          );
        } else {
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
        // TOOLTIP
        layer.bindTooltip(p.venue_name, { opacity: 1 })

      }
    }).addTo(map);

    map.on("popupclose", () => onPopupClose());


    fishfryLayer.bringToFront();
    refChurches.bringToBack();
    refMunis.bringToBack();

    // --------------------------------------
    // Leaflet ID to FFID lookup, used for map-table interactivity

    lookupLayerIdFfid = {}
    lookupFfidLayerId = {}
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
      columns: [{
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
      }],
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
        onSelectTableRow(e, dt, type, indexes)
      }
    });

    fishfryTable.on("deselect", function (e, dt, type, indexes) {
      if (type === "row") {
        onDeselectTableRow(e, dt, type, indexes)
      }
    });

  });

  /**
   * functions for table-map interactivity
   */

  function onPopupClose() {
    fishfryTable.rows().deselect();
  }

  function onSelectTableRow(e, dt, type, indexes) {
    // enable the edit button 
    var featureId = enableEditButton(e, dt, type, indexes);

    // open the map popup
    map._layers[lookupFfidLayerId[featureId]].fire('click');
  }

  function disableEditButton(e, dt, type, indexes) {
    $(".editbutton").attr("disabled", true);
    $(".editbutton").text(
      "Edit Selected Fish Fry"
    );
  }

  function enableEditButton(e, dt, type, indexes) {
    var row = fishfryTable.rows(indexes).data(); //.pluck('id');
    var feature = row['0'];
    $(".editbutton").attr("disabled", false);
    $(".editbutton").attr("href", Flask.url_for("load_fishfry", {
      ffid: feature.id
    }));
    $(".editbutton").text(
      "Edit: " + feature.properties.venue_name
    );
    return feature.id;
  }

  function onDeselectTableRow(e, dt, type, indexes) {
    // disable edit button
    disableEditButton(e, dt, type, indexes);
    // deselect on the map
    map.closePopup();
  }

});

