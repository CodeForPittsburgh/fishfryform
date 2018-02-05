/**
 * fishfryform.js
 *
 * Client side sparkle for the Fish Fry Form. Includes:
 * - Leaflet for the map
 * - Momemnt for the datetime picker
 * - Autocomplete for type-ahead functionality (used with the geocoder)
 */

// imports
var $ = (jQuery = require("jquery"));
var moment = require("moment");
var datetimepicker = require("pc-bootstrap4-datetimepicker");
// var autoComplete = require("javascript-autocomplete");
var Handlebars = require("handlebars");
var L = require("leaflet");
var typeahead = require("typeahead.js/dist/typeahead.bundle.js");

/**
 * Map and Geocoding
 */
$(function() {
    /**--------------------------------------------------------------------------
     * Leaflet Map
     */

    var map, fishfryLayer, addressLayer;

    var map = new L.Map("map", {
        center: [40.440734, -80.0091294],
        zoom: 10
    });

    var basemap = L.tileLayer(
        "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: 'Tiles via <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> license. Basemap data from <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a> license.'
        }
    ).addTo(map);

    addressLayer = L.layerGroup([]);

    fishfryLayer = L.geoJSON(null).addTo(map);

    /**--------------------------------------------------------------------------
     * Geocoding w/typeahead search functionality
     */

    /* Highlight search box text on click */
    $("#venue_address").click(function() {
        $(this).select();
    });

    /* Prevent hitting enter from refreshing the page */
    $("#venue_address").keypress(function(e) {
        if (e.which == 13) {
            e.preventDefault();
        }
    });

    var addressSearch = new Bloodhound({
        name: "Mapbox",
        datumTokenizer: function(d) {
            return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: "https://api.mapbox.com/geocoding/v5/mapbox.places/%QUERY.json?&access_token=pk.eyJ1IjoiY2l2aWNtYXBwZXIiLCJhIjoiY2pkOXV4cnk4MTVpMDJ3bzlneTFydDZlbCJ9.wrwB1uO53s_FhpVJv-Zf-Q",
            filter: function(data) {
                return $.map(data.features, function(feature) {
                    return {
                        name: feature.place_name,
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0],
                        source: "Mapbox"
                    };
                });
            },
            ajax: {
                beforeSend: function(jqXhr, settings) {
                    console.log("beforeSend", jqXhr, settings);
                    $("#searchicon")
                        .removeClass("fa-search")
                        .addClass("fa-refresh fa-spin");
                    // settings.url += "&boundary.rect.min_lat=40.1243&boundary.rect.min_lon=-80.5106&boundary.rect.max_lat=40.7556&boundary.rect.max_lon=-79.4064";
                },
                complete: function(jqXHR, status) {
                    console.log("afterSend", status);
                    $("#searchicon")
                        .removeClass("fa-refresh fa-spin")
                        .addClass("fa-search");
                }
            }
        },
        limit: 5
    });

    addressSearch.initialize();

    $("#venue_address")
        .typeahead({
            minLength: 3,
            highlight: true,
            hint: false
        }, {
            name: "Mapbox",
            displayKey: "name",
            source: addressSearch.ttAdapter(),
            templates: {
                header: "<p class='typeahead-header'>Select address:</p>",
                suggestion: Handlebars.compile(["{{name}}"].join(""))
            }
        })
        .on("typeahead:selected", function(obj, datum) {
            // once an address is selected from the drop-down:
            console.log("You found: ", datum);
            // store the position of the address at latLng object
            var latlng = L.latLng({
                lat: datum.lat,
                lng: datum.lng
            });

            // set the map view to the address location
            addressLayer.clearLayers();
            addressLayer.addLayer(L.circleMarker(latlng));

            // add a point at the address, bind a pop-up, and open the pop-up automatically
            addressLayer
                .bindPopup(
                    "<h4>" +
                    datum.name +
                    "</h4><p>" +
                    datum.lng +
                    ", " +
                    datum.lat +
                    "</p>"
                )
                .openPopup();
            map.setView(latlng, 15);
        });

    $(".twitter-typeahead").css("position", "static");
    $(".twitter-typeahead").css("display", "block");

    /**
     * reset the address search box, remove the geocoded address point, and
     * close the pop-up.
     */
    function resetAddressSearch() {
        $("#venue_address").val("");
        addressLayer.clearLayers();
        addressLayer.closePopup();
    }
});

$(function() {
    // var season_start = moment("2018-02-07").toISOString();
    // var season_end = moment("2018-04-08").toISOString();
    // console.log(season_start, season_end);
    var dtp = "DateTimePicker";
    var attach_datepicker = function(ele_dt_start, ele_dt_end) {
        // get initial values from the form element
        var dt_start = moment($(ele_dt_start).val());
        var dt_end = moment($(ele_dt_end).val());
        // here, we set the min/max dates based on what's available.
        var maxDate,
            minDate,
            defaultDateStart,
            defaultDateEnd = null;
        if (dt_start.toISOString() && dt_end.toISOString()) {
            minDate = dt_start;
            maxDate = dt_end;
            defaultDateStart = dt_start;
            defaultDateEnd = dt_end;
        }
        // set initial values for the datepicker
        $(ele_dt_start)
            .datetimepicker({
                // format: "YYYY-MM-DD hh:mm A",
                // minDate: moment(),
                // defaultDate: defaultDateStart,
                useCurrent: true,
                maxDate: maxDate,
                stepping: 15
            })
            .data(dtp)
            .date(dt_start);
        $(ele_dt_end)
            .datetimepicker({
                // format: "YYYY-MM-DD hh:mm A",
                minDate: minDate,
                defaultDate: defaultDateEnd,
                stepping: 15,
                useCurrent: false //Important! See issue #1075
            })
            .data(dtp)
            .date(dt_end);

        // attach change events, which link the pickers
        $(ele_dt_start).on("dp.change", function(e) {
            console.log("start", e.date);
            $(ele_dt_end)
                // .val(e.date.format("YYYY-MM-DD hh:mm A"))
                .data(dtp)
                .minDate(e.date);
        });
        $(ele_dt_end).on("dp.change", function(e) {
            console.log("end", e.date);
            $(ele_dt_start)
                // .val(e.date.format("YYYY-MM-DD hh:mm A"))
                .data(dtp)
                .maxDate(e.date);
        });
    };

    var attach_del_button = function(ele) {
        $(".event-delete-button").click(function() {
            var thisRow = $(this).closest("li.list-group-item");
            thisRow.remove();
            event_tally = event_tally - 1;
            return;
        });
    };

    var event_tally = 0;
    var eventPickers = $('li[id^="events-"]');
    $.each(eventPickers, function(i, e) {
        var ele_dt_start = "#events-" + i + "-dt_start";
        var ele_dt_end = "#events-" + i + "-dt_end";
        attach_datepicker(ele_dt_start, ele_dt_end);
        attach_del_button();
        event_tally = event_tally += 1;
        // console.log(i, e);
    });

    /**
     * Event listener that adds a new datetime picker element to the list. Uses
     * a handlebars template.
     */
    $("#event-add-button").click(function() {
        // populate content for the results modal, and show the modal
        // ...get and compile the template from the page
        var compiledTemplate = Handlebars.compile(
            $("#event-picker-template").html()
        );
        var attr_dt_start = "events-" + event_tally + "-dt_start";
        var attr_dt_end = "events-" + event_tally + "-dt_end";
        // add attributes to the result
        var eventContent = compiledTemplate({
            attr_dt_start: attr_dt_start,
            attr_dt_end: attr_dt_end,
            event_count: event_tally
        });
        // push it to the modal
        $("ul#events.list-group").append(eventContent);
        attach_datepicker("#" + attr_dt_start, "#" + attr_dt_end);
        attach_del_button();
        event_tally = event_tally + 1;
    });

    /**
     * Event listener that removes a new datetime picker element from the list
     */
    $(".event-delete-button").click(function() {
        var thisRow = $(this).closest("li.list-group-item");
        thisRow.remove();
        event_tally = event_tally - 1;
        return;
    });
});
// var map, fishfryLayer;

// function makeMap() {

//     var map = new L.Map("map", {
//         center: [40.440734, -80.0091294],
//         zoom: 10
//     });

//     var basemap = L.tileLayer(
//         "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
//             maxZoom: 18,
//             attribution: 'Tiles via <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> license. Basemap data from <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a> license.'
//         }
//     ).addTo(map);

//     fishfryLayer = L.geoJSON(null).addTo(map);

// }