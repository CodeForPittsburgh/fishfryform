/**
 * fishfryform.js
 *
 * Client side sparkle for the Fish Fry Form. Includes:
 * - Leaflet for the map
 * - Momemnt for the datetime picker
 * - Autocomplete for type-ahead functionality (used with the geocoder)
 */

// imports
// var $ = jQuery;
var L = require("leaflet");
var moment = require("moment");
var autoComplete = require("javascript-autocomplete");

/**
 * Push the FishFry events array to the form, generating the UI as it goes.
 *
 * @param {array} events_array
 */
function loadEvents(events_array) {
    // update the datetime list; clear it out first
    $("#events").empty();
    // (future - check UUIDs and add/remove based on matching)
    // assemble a new one and
    $.each(self.events, function(k, v) {
        //convert date/time to readable format (only for display; class value remains)
        var event_start = moment(v.dt_start).format("YYYY-MM-DD HH:mm");
        var event_end = moment(v.dt_end).format("YYYY-MM-DD HH:mm");

        // write UUID as element ID field; used to manage updates.
        var event_dt_li =
            '<li class="list-group-item" id="' +
            k +
            '"><div class="form-group"><div class="input-group">';
        // add start and end time to the list
        event_dt_li +=
            '<input disabled="disabled" type="text" class="form-control" value="' +
            event_start +
            "&mdash;" +
            event_end +
            '">';
        event_dt_li +=
            '<span class="input-group-btn"><button name="remove_dt" id="' +
            k +
            '"class="btn btn-danger" type="button"><span class="glyphicon glyphicon-remove" aria-hidden="true"></button></span>';
        event_dt_li += "</div></div></li>";

        // ADD RESULT TO PAGE ELEMENT
        $("#events").append(event_dt_li);

        // bind a remove function (rm datetime from list on "X" button click)
        $("button[id='" + k + "']").bind("click", function() {
            // remove the UI item
            $(this)
                .closest(".list-group-item")
                .remove();
            // remove the class item
            console.log(
                "Removed " + JSON.stringify(self.events[k]) + " from events list."
            );
            delete self.events[k];
        });
    });
    //console.log(self.events);
}

/**
 * Function that gets events from the datetime picker elements and puts them
 * in a form field.
 */
function saveEvents() {}

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