/**
 * fishfryform.js
 *
 * Client side sparkle for the Fish Fry Form. Includes:
 * - Leaflet for the map
 * - Momemnt for the datetime picker
 * - Autocomplete for type-ahead functionality (used with the geocoder)
 */

// imports
var $ = require("jquery");
var moment = require("moment");
var datetimepicker = require("pc-bootstrap4-datetimepicker");
// var autoComplete = require("javascript-autocomplete");
var Handlebars = require("handlebars");
// require("typeahead.js/dist/typeahead.bundle.js");
var L = require("leaflet");
console.log(typeof datetimepicker);

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

    var event_tally = 0;
    var eventPickers = $('li[id^="events-"]');
    $.each(eventPickers, function(i, e) {
        var ele_dt_start = "#events-" + i + "-dt_start";
        var ele_dt_end = "#events-" + i + "-dt_end";
        attach_datepicker(ele_dt_start, ele_dt_end);
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
            attr_dt_end: attr_dt_end
        });
        // push it to the modal
        $("ul#events.list-group").append(eventContent);
        attach_datepicker("#" + attr_dt_start, "#" + attr_dt_end);
        event_tally = event_tally + 1;
    });

    /**
     * Event listener that removes a new datetime picker element from the list
     */
    $(".event-delete-button").click(function() {
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