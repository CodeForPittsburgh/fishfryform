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
// var h = require('moment-holiday')
var datetimepicker = require("pc-bootstrap4-datetimepicker");
var Handlebars = require("handlebars");
var L = require("leaflet");
require("./lib/typeahead.js/dist/typeahead.bundle")

// Easter dates
// TODO: don't hardcode this
window.easterDates = {
    easterSunday: ["2024-03-31"],
    goodFriday: ["2024-03-29"],
    ashWednesday: ["2024-02-14"],
    lentenFridays: ["2024-02-16", "2024-02-23", "2024-03-01", "2024-03-08", "2024-03-15", "2024-03-22"]
}

/**
 * calculate Easter dates
 * TODO: make this work (may be a Windows-specific error, see https://github.com/kodie/moment-holiday/issues/22)
 */
// $(function () {
//     // add Easter to the holidays list (not a default otherwise)
//     h.modifyHolidays.set('United States').add('Easter')

//     // calculate datetimes for the easter dates **for this year**
//     window.easterDates.easterSunday = h().holiday('Easter Sunday').toISOString()

//     window.easterDates.goodFriday = moment(window.easterDates.easterSunday).subtract(2, 'days').toISOString()
//     window.easterDates.ashWednesday = moment(window.easterDates.goodFriday).subtract(6, 'weeks').subtract(2, 'days').toISOString()

//     for (var i = 1; i < 7; i++) {
//         window.easterDates.lentenFridays.push(
//             moment(window.easterDates.goodFriday).subtract(i, 'week').toISOString()
//         )
//     }
// })




/**
 * Map and Geocoding
 */
$(function () {
    /**--------------------------------------------------------------------------
     * Leaflet Map
     */

    var map, fishfryLayer, addressLayer, basemap;

    map = new L.Map("map", {
        center: [40.440734, -80.0091294],
        zoom: 10
    });

    basemap = L.tileLayer(
        "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: 'Basemap from <a href="http://www.carto.com">CARTO</a>. | <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a> license.'
    }
    ).addTo(map);

    // fishfryLayer = L.geoJSON(null).addTo(map);
    addressLayer = L.layerGroup([]).addTo(map);

    /**--------------------------------------------------------------------------
     * Address, X, Y field linkage to map
     */
    function isNumeric(n) {
        // console.log(n, typeof n);
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function setAddressPoint(lat, lng, addr) {
        // console.log(isNumeric(lat), isNumeric(lng));
        if ($.isNumeric(lat) && $.isNumeric(lng)) {
            console.log("Setting point @", lat, ", ", lng);
            // store the position of the address at latLng object
            var latlng = L.latLng({ lat: lat, lng: lng });
            addressLayer.clearLayers();
            // add a point at the address, bind a pop-up, and open the pop-up automatically
            addressLayer.addLayer(
                L.circleMarker(latlng).bindPopup(
                    "<h4>" + addr + "</h4><p>" + lng + ", " + lat + "</p>"
                )
            );
            // set the map view to the address location
            map.setView(latlng, 15);
        } else {
            // console.log("cleared");
            addressLayer.clearLayers();
        }
    }

    function getSetAddressPoint() {
        var lat = $("#lat").val();
        var lng = $("#lng").val();
        var addr = $("#venue_address").val();
        setAddressPoint(lat, lng, addr);
    }

    // attach listeners to the X,Y fields; update the map on change
    $("#lat, #lng, #venue_address").on("input", function () {
        getSetAddressPoint();
    });

    getSetAddressPoint();

    /**--------------------------------------------------------------------------
     * Geocoding w/typeahead search functionality
     */

    /* Highlight search box text on click */
    $("#venue_address").click(function () {
        $(this).select();
    });

    /* Prevent hitting enter from refreshing the page */
    $("#venue_address").keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
        }
    });

    var addressSearch = new Bloodhound({
        name: "Mapbox",
        datumTokenizer: function (d) {
            return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: "https://api.mapbox.com/geocoding/v5/mapbox.places/%QUERY.json?access_token=pk.eyJ1IjoiY2l2aWNtYXBwZXIiLCJhIjoiY2pkOXV4cnk4MTVpMDJ3bzlneTFydDZlbCJ9.wrwB1uO53s_FhpVJv-Zf-Q&country=us&proximity=-79.9976593%2C40.4396267&autocomplete=true&limit=5",
            filter: function (data) {
                return $.map(data.features, function (feature) {
                    return {
                        name: feature.place_name,
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0],
                        source: "Mapbox"
                    };
                });
            },
            ajax: {
                beforeSend: function (jqXhr, settings) {
                    console.log("beforeSend", jqXhr, settings);
                    $("#searchicon")
                        .removeClass("fa-search")
                        .addClass("fa-refresh fa-spin");
                },
                complete: function (jqXHR, status) {
                    console.log(jqXHR)
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
        .on("typeahead:selected", function (obj, datum) {
            // once an address is selected from the drop-down:
            console.log("You found: ", datum);
            setAddressPoint(datum.lat, datum.lng, datum.name);

            // set the lat/Lng into the form.
            $("#lng").val(datum.lng);
            $("#lat").val(datum.lat);
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


/**
 * Datetime Picker-maker
 */
$(function () {

    var compiledEventItemTemplate = Handlebars.compile(
        $("#event-picker-template").html()
    );

    var event_tally = 0;
    var dtp = "DateTimePicker";

    var attach_datepicker = function (ele_dt_start, ele_dt_end, dtStart, dtEnd) {


        var dt_start, dt_end;
        // if these params provided, use them
        if (dtStart !== undefined && dtEnd !== undefined) {
            dt_start = dtStart
            dt_end = dtEnd
        } else {
            // else, get initial values from the form element
            dt_start = moment($(ele_dt_start).val());
            dt_end = moment($(ele_dt_end).val());
        }
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

        // console.log(dt_start, dt_end)
        // set initial values for the datepicker
        $(ele_dt_start)
            .datetimepicker({
                format: "YYYY-MM-DD hh:mm A",
                // minDate: moment(),
                // defaultDate: defaultDateStart,
                useCurrent: true,
                // maxDate: maxDate,
                stepping: 15
            })
            .data(dtp)
            .date(dt_start);
        $(ele_dt_end)
            .datetimepicker({
                format: "YYYY-MM-DD hh:mm A",
                minDate: minDate,
                defaultDate: defaultDateEnd,
                stepping: 15,
                useCurrent: false //Important! See issue #1075
            })
            .data(dtp)
            .date(dt_end);

        // attach change events, which link the pickers
        $(ele_dt_start).on("dp.change", function (e) {
            console.log("start", e.date);
            $(ele_dt_end)
                // .val(e.date.format("YYYY-MM-DD hh:mm A"))
                .data(dtp)
                .minDate(e.date);
        });
        $(ele_dt_end).on("dp.change", function (e) {
            console.log("end", e.date);
            $(ele_dt_start)
                // .val(e.date.format("YYYY-MM-DD hh:mm A"))
                .data(dtp)
                .maxDate(e.date);
        });
    };

    var attach_del_button = function (ele) {
        $(".event-delete-button").click(function () {
            var thisRow = $(this).closest("li.list-group-item");
            thisRow.remove();
            event_tally = event_tally - 1;
            return;
        });
    };

    // forms


    // ----------------------------------------------------
    // INDIVIDUAL EVENT PICKER FORM(S)

    var eventPickers = $('li[id^="events-"]');
    $.each(eventPickers, function (i, e) {
        var ele_dt_start = "#events-" + i + "-dt_start";
        var ele_dt_end = "#events-" + i + "-dt_end";
        attach_datepicker(ele_dt_start, ele_dt_end);
        attach_del_button();
        event_tally = event_tally += 1;
        // console.log(i, e);
    });

    // ----------------------------------------------------
    // BULK EVENT PICKER FORM

    $('#bulk-t_start')
        .datetimepicker({
            format: 'LT',
            stepping: 15
        })
    // .on("dp.change", function (e) {
    //     $('#bulk-t_end')
    //         .data(dtp)
    //         .minDate(e.date);
    // });
    $('#bulk-t_end')
        .datetimepicker({
            format: 'LT',
            stepping: 15
        })
    // .on("dp.change", function (e) {
    //     console.log("end", e.date);
    //     $('#bulk-t_start')
    //         .data(dtp)
    //         .maxDate(e.date);
    // }); 

    /**
     * Event listener that adds a new datetime picker element to the list. Uses
     * a handlebars template.
     */
    $("#event-add-button").click(function () {
        // populate content for the results modal, and show the modal
        // ...get and compile the template from the page
        // since this is a new event, we increment the tally now
        event_tally = event_tally + 1;

        var attr_dt_start = "events-" + event_tally + "-dt_start";
        var attr_dt_end = "events-" + event_tally + "-dt_end";
        // add attributes to the result
        var eventContent = compiledEventItemTemplate({
            attr_dt_start: attr_dt_start,
            attr_dt_end: attr_dt_end,
            event_count: event_tally
        });
        // push it to the modal
        $("ul#events.list-group").append(eventContent);
        attach_datepicker("#" + attr_dt_start, "#" + attr_dt_end);
        attach_del_button();
        // event_tally = event_tally + 1;
    });

    /**
     * Event listener that removes a new datetime picker element from the list
     */
    $(".event-delete-button").click(function () {
        var thisRow = $(this).closest("li.list-group-item");
        thisRow.remove();
        event_tally = event_tally - 1;
        return;
    });

    /**
     * Event listener that adds a new datetime picker element from the list
     */
    $(".event-bulk-add-button").click(function (e) {

        // ID of the button used to determine if existing list is cleared first
        if (e.target.id == 'event-bulk-add-button') {
            $("ul#events.list-group").empty()
        }

        var eStart = $('#bulk-t_start').val()
        var eEnd = $('#bulk-t_end').val()

        if (eStart && eEnd) {
            // calculate a list of event start and end dts
            var bulkEvents = [];

            $.each(['lentenFridays', 'ashWednesday', 'goodFriday'], function (i, v) {
                if ($('#' + v).is(":checked")) {
                    bulkEvents.push.apply(bulkEvents, window.easterDates[v])
                }
            })
            bulkEvents.sort((a, b) => a - b)
            bulkEvents.forEach((d, i) => {

                var dtStartStr = d + " " + eStart;
                var dtEndStr = d + " " + eEnd;
                var dtStart = moment(dtStartStr, 'YYYY-MM-DD h:mm A');
                var dtEnd = moment(dtEndStr, 'YYYY-MM-DD h:mm A');

                // handle mis-ordered datetimes
                if (dtEnd.isBefore(dtStart)) {
                    dtEnd = dtStart
                }
                if (dtStart.isAfter(dtEnd)) {
                    dtStart = dtEnd
                }

                event_tally = event_tally + 1;
                var attr_dt_start = "events-" + event_tally + "-dt_start";
                var attr_dt_end = "events-" + event_tally + "-dt_end";

                var eventContent = compiledEventItemTemplate({
                    attr_dt_start: attr_dt_start,
                    attr_dt_end: attr_dt_end,
                    event_count: event_tally
                });
                // push it to the modal
                $("ul#events.list-group").append(eventContent);
                attach_datepicker(
                    "#" + attr_dt_start,
                    "#" + attr_dt_end,
                    dtStart,
                    dtEnd
                );
                attach_del_button();
            })
        }


    });
});
