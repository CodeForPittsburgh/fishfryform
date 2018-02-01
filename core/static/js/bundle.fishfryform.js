(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],2:[function(require,module,exports){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && msCrypto.getRandomValues.bind(msCrypto));
if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

},{}],3:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"./lib/bytesToUuid":1,"./lib/rng":2}],4:[function(require,module,exports){
// imports
var $ = jQuery;
var uuidV4 = require('uuid/v4');
// var L = require('leaflet');
// var models = require('./models');
var season = 2018;


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

/**
 * FishFry - class for every feature in the Fish Fry JSON
 * @class
 */
function FishFry() {
    this.season = 2018;
    this.geometry = {
        "coordinates": [],
        "type": "Point"
    };
    this.ffid = "";
    this.properties = {
        "website": "",
        "cartodb_id": null,
        "take_out": null,
        "venue_name": "",
        "lunch": true,
        "venue_address": "",
        "publish": false,
        "venue_notes": "",
        "handicap": null,
        "alcohol": false,
        "events": {},
        "homemade_pierogies": null,
        "phone": "",
        "etc": "",
        "validated": false,
        "email": "",
        "menu": {
            "url": "",
            "text": ""
        },
        "venue_type": ""
    };
}

var vm = new Vue({
    // el: '#FishFryForm',
    delimiters: ["[[", "]]"],
    data: {
        season: 2018,
        geometry: {
            coordinates: [],
            type: "Point"
        },
        ffid: "",
        properties: {
            "website": "",
            "cartodb_id": null,
            "take_out": null,
            "venue_name": "",
            "lunch": true,
            "venue_address": "",
            "publish": false,
            "venue_notes": "",
            "handicap": null,
            "alcohol": false,
            "events": {},
            "homemade_pierogies": null,
            "phone": "",
            "etc": "",
            "validated": false,
            "email": "",
            "menu": {
                "url": "",
                "text": ""
            },
            "venue_type": ""
        }
    },
    mounted: function() {
            this.$nextTick(function() {
                console.log("mounted");
            })
        }
        // created: function() {
        //     // get the ffid from the query string
        //     var queryString = (new URL(document.location)).searchParams;
        //     var ffid = queryString.get("ffid");
        //     if (ffid) {
        //         var url = Flask.url_for('api') + 'fishfries?ffid=' + ffid;
        //         console.log("loading fish fry from", url);
        //         var self = this;
        //         $.ajax({
        //             // dataType: "json",
        //             url: url,
        //             // success: populateFishFryForm
        //             success: function(data) {
        //                 console.log(data);
        //                 self.feature = data;
        //             },
        //             error: function(error) {
        //                 console.log(error);
        //             }
        //         });
        //     } else {
        //         console.log("this is a new fish fry");
        //     }
        // }
});

document.addEventListener('DOMContentLoaded', function() {
    vm.mount('#FishFryForm');
});


// /**
//  * Initiate Date/Time Picker with div element name="daterange"
//  *
//  * This works on an instance of FishFryFormClass; it is not a method.
//  */
// $(function() {
//     $('input[name="daterange"]').daterangepicker({
//         autoUpdateInput: false,
//         timePicker: true,
//         timePickerIncrement: 15,
//         timePicker24Hour: false,
//         opens: "left",
//         locale: {
//             cancelLabel: "Clear"
//         }
//     });

//     $('input[name="daterange"]').on("apply.daterangepicker", function(
//         ev,
//         picker
//     ) {
//         $(this).val(
//             picker.startDate.format("YYYY-MM-DD HH:mm") +
//             " - " +
//             picker.endDate.format("YYYY-MM-DD HH:mm")
//         );
//     });

//     $('input[name="daterange"]').on("cancel.daterangepicker", function(
//         ev,
//         picker
//     ) {
//         console.log("cancel datetime selection");
//         $(this).val("");
//     });

//     /**
//      * add datetime to list on button click using datetimepicker form data
//      */
//     $('input[name="daterange"]').on("apply.daterangepicker", function(
//         evt,
//         picker
//     ) {
//         // read in value from the picker and push to the FishFryForm class instance.
//         //var id = uuid.v4();
//         var dt_start = moment(
//             picker.startDate.format("YYYY-MM-DD HH:mm"),
//             "YYYY-MM-DD HH:mm"
//         ).format();
//         var dt_end = moment(
//             picker.endDate.format("YYYY-MM-DD HH:mm"),
//             "YYYY-MM-DD HH:mm"
//         ).format();
//         var dt_id = dt_start + "/" + dt_end;
//         FishFryForm.events[dt_id] = {
//             dt_start: dt_start,
//             dt_end: dt_end
//         };
//         //update the datetime list; clear it out first
//         $("#events").empty();
//         // assemble a new event list using the class method
//         FishFryForm.pushToFormEvents();
//     });
// });

// /**
//  * geocode function
//  * submit to geocoder and provide feedback to user for errors
//  * this is using Mapzen Search, but could be any geocoder
//  */
// FishFryFormClass.prototype.geocode = function() {
//     //assign this class instance to self
//     var self = this;
//     // if value is something:
//     if (self.venue_address !== null) {
//         // submit value to geocoder service
//         return $.ajax({
//             url: "https://maps.googleapis.com/maps/api/geocode/json",
//             data: {
//                 api_key: "AIzaSyBEvDF7yigi6dB0te3Shy24Ps_fIA_LPGY",
//                 address: self.venue_address
//             },
//             cache: false,
//             type: "GET",
//             success: function(response) {
//                 // response from google has docs-specified format
//                 coords = response.results[0].geometry.location;
//                 self.the_geom = {
//                     type: "Point",
//                     coordinates: [coords.lng, coords.lat]
//                 };
//                 console.log("ajax geocode success");
//                 console.log(self.the_geom.coordinates);
//             },
//             error: function(xhr) {
//                 console.log(xhr);
//             }
//         });
//     } else {
//         alert("You must provide an address");
//     }
// };

// /**
//  * geocode on geocode button click using entered form data
//  */
// $(function() {
//     $("#venue_address_geocode").on("click", function() {
//         //read in value from venue_address form field to the class
//         FishFryForm.venue_address = $("#venue_address").val();
//         // run the geocode method
//         var runGeocoder = FishFryForm.geocode();
//         // when it's complete, get the coordinates out of it and add to the page.
//         $.when(runGeocoder).done(function() {
//             var xy =
//                 FishFryForm.the_geom.coordinates[0] +
//                 ", " +
//                 FishFryForm.the_geom.coordinates[1];
//             // ADD RESULT TO PAGE ELEMENT
//             $("#venue_address_geocoded").empty();
//             $("#venue_address_geocoded").append(xy);
//             var center = L.latLng(
//                 FishFryForm.the_geom.coordinates[1],
//                 FishFryForm.the_geom.coordinates[0]
//             );
//             map.setView(center, 15);
//         });
//     });
// });

// $(function() {
//     $("#confirmbutton").on("click", function() {
//         FishFryForm.readFromForm();
//     });
// });

// /**
//  * initate form submission. calls internal Flask route, which handles
//  * submission of form data to database.
//  */
// $(function() {
//     $("#submitbutton").on("click", function() {
//         // read the form and get the json
//         var fishfry_json = FishFryForm.returnJSON();

//         // Last-minute property updates...
//         // check if validation checkbox on confirmation modal is true
//         if ($("#validated").prop("checked")) {
//             fishfry_json.validated = true;
//         }
//         // then also check if both publish confirmations have been checked.
//         //if (($('#publishThis').prop('checked')) & ($('#publishThisYesReally').prop('checked'))) {
//         if ($("#publish").prop("checked")) {
//             fishfry_json.publish = true;
//         }
//         console.log("---");
//         console.log("Submitted Fish Fry:");
//         console.log(fishfry_json);
//         console.log(JSON.stringify(fishfry_json));

//         $.ajax({
//             type: "POST",
//             contentType: "application/json;charset=UTF-8",
//             // url: $SCRIPT_ROOT + "/contribute/fishfry/submit",
//             url: Flask.url_for('submit_fishfry'),
//             data: JSON.stringify(fishfry_json),
//             success: function(response) {
//                 console.log("success");
//                 console.log(response);
//                 var r = JSON.parse(response);
//                 console.log(r);
//                 $("#myModal").modal("hide");
//                 $("#alert-success").show();
//                 // a redirect param will be provided if the fish fry was new
//                 if (r.redirect) {
//                     /* the redirect loads the newly submitted Fish Fry into the editing
//                      * version of the form via '/contribute/fishfry/<int:ff_id>'
//                      */
//                     window.location.replace($Flask.url_for('home') + r.redirect);
//                 }
//             },
//             error: function(error) {
//                 console.log("error");
//                 console.log(error);
//                 $("#myModal").modal("hide");
//                 $("#alert-warning").show();
//             }
//         });
//     });
// });
},{"uuid/v4":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvdXVpZC9saWIvYnl0ZXNUb1V1aWQuanMiLCJub2RlX21vZHVsZXMvdXVpZC9saWIvcm5nLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXVpZC92NC5qcyIsInNyYy9qcy9maXNoZnJ5Zm9ybS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENvbnZlcnQgYXJyYXkgb2YgMTYgYnl0ZSB2YWx1ZXMgdG8gVVVJRCBzdHJpbmcgZm9ybWF0IG9mIHRoZSBmb3JtOlxuICogWFhYWFhYWFgtWFhYWC1YWFhYLVhYWFgtWFhYWFhYWFhYWFhYXG4gKi9cbnZhciBieXRlVG9IZXggPSBbXTtcbmZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyArK2kpIHtcbiAgYnl0ZVRvSGV4W2ldID0gKGkgKyAweDEwMCkudG9TdHJpbmcoMTYpLnN1YnN0cigxKTtcbn1cblxuZnVuY3Rpb24gYnl0ZXNUb1V1aWQoYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBvZmZzZXQgfHwgMDtcbiAgdmFyIGJ0aCA9IGJ5dGVUb0hleDtcbiAgcmV0dXJuIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBieXRlc1RvVXVpZDtcbiIsIi8vIFVuaXF1ZSBJRCBjcmVhdGlvbiByZXF1aXJlcyBhIGhpZ2ggcXVhbGl0eSByYW5kb20gIyBnZW5lcmF0b3IuICBJbiB0aGVcbi8vIGJyb3dzZXIgdGhpcyBpcyBhIGxpdHRsZSBjb21wbGljYXRlZCBkdWUgdG8gdW5rbm93biBxdWFsaXR5IG9mIE1hdGgucmFuZG9tKClcbi8vIGFuZCBpbmNvbnNpc3RlbnQgc3VwcG9ydCBmb3IgdGhlIGBjcnlwdG9gIEFQSS4gIFdlIGRvIHRoZSBiZXN0IHdlIGNhbiB2aWFcbi8vIGZlYXR1cmUtZGV0ZWN0aW9uXG5cbi8vIGdldFJhbmRvbVZhbHVlcyBuZWVkcyB0byBiZSBpbnZva2VkIGluIGEgY29udGV4dCB3aGVyZSBcInRoaXNcIiBpcyBhIENyeXB0byBpbXBsZW1lbnRhdGlvbi5cbnZhciBnZXRSYW5kb21WYWx1ZXMgPSAodHlwZW9mKGNyeXB0bykgIT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcy5iaW5kKGNyeXB0bykpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgKHR5cGVvZihtc0NyeXB0bykgIT0gJ3VuZGVmaW5lZCcgJiYgbXNDcnlwdG8uZ2V0UmFuZG9tVmFsdWVzLmJpbmQobXNDcnlwdG8pKTtcbmlmIChnZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0byBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIHZhciBybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGdldFJhbmRvbVZhbHVlcyhybmRzOCk7XG4gICAgcmV0dXJuIHJuZHM4O1xuICB9O1xufSBlbHNlIHtcbiAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAvL1xuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIE1hdGgucmFuZG9tKCkuICBJdCdzIGZhc3QsIGJ1dCBpcyBvZiB1bnNwZWNpZmllZFxuICAvLyBxdWFsaXR5LlxuICB2YXIgcm5kcyA9IG5ldyBBcnJheSgxNik7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtYXRoUk5HKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCByOyBpIDwgMTY7IGkrKykge1xuICAgICAgaWYgKChpICYgMHgwMykgPT09IDApIHIgPSBNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwMDA7XG4gICAgICBybmRzW2ldID0gciA+Pj4gKChpICYgMHgwMykgPDwgMykgJiAweGZmO1xuICAgIH1cblxuICAgIHJldHVybiBybmRzO1xuICB9O1xufVxuIiwidmFyIHJuZyA9IHJlcXVpcmUoJy4vbGliL3JuZycpO1xudmFyIGJ5dGVzVG9VdWlkID0gcmVxdWlyZSgnLi9saWIvYnl0ZXNUb1V1aWQnKTtcblxuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG5cbiAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xuICAgIGJ1ZiA9IG9wdGlvbnMgPT09ICdiaW5hcnknID8gbmV3IEFycmF5KDE2KSA6IG51bGw7XG4gICAgb3B0aW9ucyA9IG51bGw7XG4gIH1cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIHJuZHMgPSBvcHRpb25zLnJhbmRvbSB8fCAob3B0aW9ucy5ybmcgfHwgcm5nKSgpO1xuXG4gIC8vIFBlciA0LjQsIHNldCBiaXRzIGZvciB2ZXJzaW9uIGFuZCBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGBcbiAgcm5kc1s2XSA9IChybmRzWzZdICYgMHgwZikgfCAweDQwO1xuICBybmRzWzhdID0gKHJuZHNbOF0gJiAweDNmKSB8IDB4ODA7XG5cbiAgLy8gQ29weSBieXRlcyB0byBidWZmZXIsIGlmIHByb3ZpZGVkXG4gIGlmIChidWYpIHtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgMTY7ICsraWkpIHtcbiAgICAgIGJ1ZltpICsgaWldID0gcm5kc1tpaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZiB8fCBieXRlc1RvVXVpZChybmRzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB2NDtcbiIsIi8vIGltcG9ydHNcclxudmFyICQgPSBqUXVlcnk7XHJcbnZhciB1dWlkVjQgPSByZXF1aXJlKCd1dWlkL3Y0Jyk7XHJcbi8vIHZhciBMID0gcmVxdWlyZSgnbGVhZmxldCcpO1xyXG4vLyB2YXIgbW9kZWxzID0gcmVxdWlyZSgnLi9tb2RlbHMnKTtcclxudmFyIHNlYXNvbiA9IDIwMTg7XHJcblxyXG5cclxuLy8gdmFyIG1hcCwgZmlzaGZyeUxheWVyO1xyXG5cclxuLy8gZnVuY3Rpb24gbWFrZU1hcCgpIHtcclxuXHJcbi8vICAgICB2YXIgbWFwID0gbmV3IEwuTWFwKFwibWFwXCIsIHtcclxuLy8gICAgICAgICBjZW50ZXI6IFs0MC40NDA3MzQsIC04MC4wMDkxMjk0XSxcclxuLy8gICAgICAgICB6b29tOiAxMFxyXG4vLyAgICAgfSk7XHJcblxyXG4vLyAgICAgdmFyIGJhc2VtYXAgPSBMLnRpbGVMYXllcihcclxuLy8gICAgICAgICBcImh0dHBzOi8vY2FydG9kYi1iYXNlbWFwcy17c30uZ2xvYmFsLnNzbC5mYXN0bHkubmV0L2xpZ2h0X2FsbC97en0ve3h9L3t5fS5wbmdcIiwge1xyXG4vLyAgICAgICAgICAgICBtYXhab29tOiAxOCxcclxuLy8gICAgICAgICAgICAgYXR0cmlidXRpb246ICdUaWxlcyB2aWEgPGEgaHJlZj1cImh0dHA6Ly9zdGFtZW4uY29tXCI+U3RhbWVuIERlc2lnbjwvYT4sIHVuZGVyIDxhIGhyZWY9XCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS8zLjBcIj5DQyBCWSAzLjA8L2E+IGxpY2Vuc2UuIEJhc2VtYXAgZGF0YSBmcm9tIDxhIGhyZWY9XCJodHRwOi8vb3BlbnN0cmVldG1hcC5vcmdcIj5PcGVuU3RyZWV0TWFwPC9hPiwgdW5kZXIgPGEgaHJlZj1cImh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LXNhLzMuMFwiPkNDIEJZIFNBPC9hPiBsaWNlbnNlLidcclxuLy8gICAgICAgICB9XHJcbi8vICAgICApLmFkZFRvKG1hcCk7XHJcblxyXG4vLyAgICAgZmlzaGZyeUxheWVyID0gTC5nZW9KU09OKG51bGwpLmFkZFRvKG1hcCk7XHJcblxyXG4vLyB9XHJcblxyXG4vKipcclxuICogRmlzaEZyeSAtIGNsYXNzIGZvciBldmVyeSBmZWF0dXJlIGluIHRoZSBGaXNoIEZyeSBKU09OXHJcbiAqIEBjbGFzc1xyXG4gKi9cclxuZnVuY3Rpb24gRmlzaEZyeSgpIHtcclxuICAgIHRoaXMuc2Vhc29uID0gMjAxODtcclxuICAgIHRoaXMuZ2VvbWV0cnkgPSB7XHJcbiAgICAgICAgXCJjb29yZGluYXRlc1wiOiBbXSxcclxuICAgICAgICBcInR5cGVcIjogXCJQb2ludFwiXHJcbiAgICB9O1xyXG4gICAgdGhpcy5mZmlkID0gXCJcIjtcclxuICAgIHRoaXMucHJvcGVydGllcyA9IHtcclxuICAgICAgICBcIndlYnNpdGVcIjogXCJcIixcclxuICAgICAgICBcImNhcnRvZGJfaWRcIjogbnVsbCxcclxuICAgICAgICBcInRha2Vfb3V0XCI6IG51bGwsXHJcbiAgICAgICAgXCJ2ZW51ZV9uYW1lXCI6IFwiXCIsXHJcbiAgICAgICAgXCJsdW5jaFwiOiB0cnVlLFxyXG4gICAgICAgIFwidmVudWVfYWRkcmVzc1wiOiBcIlwiLFxyXG4gICAgICAgIFwicHVibGlzaFwiOiBmYWxzZSxcclxuICAgICAgICBcInZlbnVlX25vdGVzXCI6IFwiXCIsXHJcbiAgICAgICAgXCJoYW5kaWNhcFwiOiBudWxsLFxyXG4gICAgICAgIFwiYWxjb2hvbFwiOiBmYWxzZSxcclxuICAgICAgICBcImV2ZW50c1wiOiB7fSxcclxuICAgICAgICBcImhvbWVtYWRlX3BpZXJvZ2llc1wiOiBudWxsLFxyXG4gICAgICAgIFwicGhvbmVcIjogXCJcIixcclxuICAgICAgICBcImV0Y1wiOiBcIlwiLFxyXG4gICAgICAgIFwidmFsaWRhdGVkXCI6IGZhbHNlLFxyXG4gICAgICAgIFwiZW1haWxcIjogXCJcIixcclxuICAgICAgICBcIm1lbnVcIjoge1xyXG4gICAgICAgICAgICBcInVybFwiOiBcIlwiLFxyXG4gICAgICAgICAgICBcInRleHRcIjogXCJcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJ2ZW51ZV90eXBlXCI6IFwiXCJcclxuICAgIH07XHJcbn1cclxuXHJcbnZhciB2bSA9IG5ldyBWdWUoe1xyXG4gICAgLy8gZWw6ICcjRmlzaEZyeUZvcm0nLFxyXG4gICAgZGVsaW1pdGVyczogW1wiW1tcIiwgXCJdXVwiXSxcclxuICAgIGRhdGE6IHtcclxuICAgICAgICBzZWFzb246IDIwMTgsXHJcbiAgICAgICAgZ2VvbWV0cnk6IHtcclxuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtdLFxyXG4gICAgICAgICAgICB0eXBlOiBcIlBvaW50XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZmaWQ6IFwiXCIsXHJcbiAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICBcIndlYnNpdGVcIjogXCJcIixcclxuICAgICAgICAgICAgXCJjYXJ0b2RiX2lkXCI6IG51bGwsXHJcbiAgICAgICAgICAgIFwidGFrZV9vdXRcIjogbnVsbCxcclxuICAgICAgICAgICAgXCJ2ZW51ZV9uYW1lXCI6IFwiXCIsXHJcbiAgICAgICAgICAgIFwibHVuY2hcIjogdHJ1ZSxcclxuICAgICAgICAgICAgXCJ2ZW51ZV9hZGRyZXNzXCI6IFwiXCIsXHJcbiAgICAgICAgICAgIFwicHVibGlzaFwiOiBmYWxzZSxcclxuICAgICAgICAgICAgXCJ2ZW51ZV9ub3Rlc1wiOiBcIlwiLFxyXG4gICAgICAgICAgICBcImhhbmRpY2FwXCI6IG51bGwsXHJcbiAgICAgICAgICAgIFwiYWxjb2hvbFwiOiBmYWxzZSxcclxuICAgICAgICAgICAgXCJldmVudHNcIjoge30sXHJcbiAgICAgICAgICAgIFwiaG9tZW1hZGVfcGllcm9naWVzXCI6IG51bGwsXHJcbiAgICAgICAgICAgIFwicGhvbmVcIjogXCJcIixcclxuICAgICAgICAgICAgXCJldGNcIjogXCJcIixcclxuICAgICAgICAgICAgXCJ2YWxpZGF0ZWRcIjogZmFsc2UsXHJcbiAgICAgICAgICAgIFwiZW1haWxcIjogXCJcIixcclxuICAgICAgICAgICAgXCJtZW51XCI6IHtcclxuICAgICAgICAgICAgICAgIFwidXJsXCI6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICBcInRleHRcIjogXCJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcInZlbnVlX3R5cGVcIjogXCJcIlxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBtb3VudGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy4kbmV4dFRpY2soZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIm1vdW50ZWRcIik7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGNyZWF0ZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vICAgICAvLyBnZXQgdGhlIGZmaWQgZnJvbSB0aGUgcXVlcnkgc3RyaW5nXHJcbiAgICAgICAgLy8gICAgIHZhciBxdWVyeVN0cmluZyA9IChuZXcgVVJMKGRvY3VtZW50LmxvY2F0aW9uKSkuc2VhcmNoUGFyYW1zO1xyXG4gICAgICAgIC8vICAgICB2YXIgZmZpZCA9IHF1ZXJ5U3RyaW5nLmdldChcImZmaWRcIik7XHJcbiAgICAgICAgLy8gICAgIGlmIChmZmlkKSB7XHJcbiAgICAgICAgLy8gICAgICAgICB2YXIgdXJsID0gRmxhc2sudXJsX2ZvcignYXBpJykgKyAnZmlzaGZyaWVzP2ZmaWQ9JyArIGZmaWQ7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcImxvYWRpbmcgZmlzaCBmcnkgZnJvbVwiLCB1cmwpO1xyXG4gICAgICAgIC8vICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIC8vICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAvLyAgICAgICAgICAgICAvLyBkYXRhVHlwZTogXCJqc29uXCIsXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgLy8gc3VjY2VzczogcG9wdWxhdGVGaXNoRnJ5Rm9ybVxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIHNlbGYuZmVhdHVyZSA9IGRhdGE7XHJcbiAgICAgICAgLy8gICAgICAgICAgICAgfSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgIC8vICAgICAgICAgICAgIH1cclxuICAgICAgICAvLyAgICAgICAgIH0pO1xyXG4gICAgICAgIC8vICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc29sZS5sb2coXCJ0aGlzIGlzIGEgbmV3IGZpc2ggZnJ5XCIpO1xyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gfVxyXG59KTtcclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcclxuICAgIHZtLm1vdW50KCcjRmlzaEZyeUZvcm0nKTtcclxufSk7XHJcblxyXG5cclxuLy8gLyoqXHJcbi8vICAqIEluaXRpYXRlIERhdGUvVGltZSBQaWNrZXIgd2l0aCBkaXYgZWxlbWVudCBuYW1lPVwiZGF0ZXJhbmdlXCJcclxuLy8gICpcclxuLy8gICogVGhpcyB3b3JrcyBvbiBhbiBpbnN0YW5jZSBvZiBGaXNoRnJ5Rm9ybUNsYXNzOyBpdCBpcyBub3QgYSBtZXRob2QuXHJcbi8vICAqL1xyXG4vLyAkKGZ1bmN0aW9uKCkge1xyXG4vLyAgICAgJCgnaW5wdXRbbmFtZT1cImRhdGVyYW5nZVwiXScpLmRhdGVyYW5nZXBpY2tlcih7XHJcbi8vICAgICAgICAgYXV0b1VwZGF0ZUlucHV0OiBmYWxzZSxcclxuLy8gICAgICAgICB0aW1lUGlja2VyOiB0cnVlLFxyXG4vLyAgICAgICAgIHRpbWVQaWNrZXJJbmNyZW1lbnQ6IDE1LFxyXG4vLyAgICAgICAgIHRpbWVQaWNrZXIyNEhvdXI6IGZhbHNlLFxyXG4vLyAgICAgICAgIG9wZW5zOiBcImxlZnRcIixcclxuLy8gICAgICAgICBsb2NhbGU6IHtcclxuLy8gICAgICAgICAgICAgY2FuY2VsTGFiZWw6IFwiQ2xlYXJcIlxyXG4vLyAgICAgICAgIH1cclxuLy8gICAgIH0pO1xyXG5cclxuLy8gICAgICQoJ2lucHV0W25hbWU9XCJkYXRlcmFuZ2VcIl0nKS5vbihcImFwcGx5LmRhdGVyYW5nZXBpY2tlclwiLCBmdW5jdGlvbihcclxuLy8gICAgICAgICBldixcclxuLy8gICAgICAgICBwaWNrZXJcclxuLy8gICAgICkge1xyXG4vLyAgICAgICAgICQodGhpcykudmFsKFxyXG4vLyAgICAgICAgICAgICBwaWNrZXIuc3RhcnREYXRlLmZvcm1hdChcIllZWVktTU0tREQgSEg6bW1cIikgK1xyXG4vLyAgICAgICAgICAgICBcIiAtIFwiICtcclxuLy8gICAgICAgICAgICAgcGlja2VyLmVuZERhdGUuZm9ybWF0KFwiWVlZWS1NTS1ERCBISDptbVwiKVxyXG4vLyAgICAgICAgICk7XHJcbi8vICAgICB9KTtcclxuXHJcbi8vICAgICAkKCdpbnB1dFtuYW1lPVwiZGF0ZXJhbmdlXCJdJykub24oXCJjYW5jZWwuZGF0ZXJhbmdlcGlja2VyXCIsIGZ1bmN0aW9uKFxyXG4vLyAgICAgICAgIGV2LFxyXG4vLyAgICAgICAgIHBpY2tlclxyXG4vLyAgICAgKSB7XHJcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJjYW5jZWwgZGF0ZXRpbWUgc2VsZWN0aW9uXCIpO1xyXG4vLyAgICAgICAgICQodGhpcykudmFsKFwiXCIpO1xyXG4vLyAgICAgfSk7XHJcblxyXG4vLyAgICAgLyoqXHJcbi8vICAgICAgKiBhZGQgZGF0ZXRpbWUgdG8gbGlzdCBvbiBidXR0b24gY2xpY2sgdXNpbmcgZGF0ZXRpbWVwaWNrZXIgZm9ybSBkYXRhXHJcbi8vICAgICAgKi9cclxuLy8gICAgICQoJ2lucHV0W25hbWU9XCJkYXRlcmFuZ2VcIl0nKS5vbihcImFwcGx5LmRhdGVyYW5nZXBpY2tlclwiLCBmdW5jdGlvbihcclxuLy8gICAgICAgICBldnQsXHJcbi8vICAgICAgICAgcGlja2VyXHJcbi8vICAgICApIHtcclxuLy8gICAgICAgICAvLyByZWFkIGluIHZhbHVlIGZyb20gdGhlIHBpY2tlciBhbmQgcHVzaCB0byB0aGUgRmlzaEZyeUZvcm0gY2xhc3MgaW5zdGFuY2UuXHJcbi8vICAgICAgICAgLy92YXIgaWQgPSB1dWlkLnY0KCk7XHJcbi8vICAgICAgICAgdmFyIGR0X3N0YXJ0ID0gbW9tZW50KFxyXG4vLyAgICAgICAgICAgICBwaWNrZXIuc3RhcnREYXRlLmZvcm1hdChcIllZWVktTU0tREQgSEg6bW1cIiksXHJcbi8vICAgICAgICAgICAgIFwiWVlZWS1NTS1ERCBISDptbVwiXHJcbi8vICAgICAgICAgKS5mb3JtYXQoKTtcclxuLy8gICAgICAgICB2YXIgZHRfZW5kID0gbW9tZW50KFxyXG4vLyAgICAgICAgICAgICBwaWNrZXIuZW5kRGF0ZS5mb3JtYXQoXCJZWVlZLU1NLUREIEhIOm1tXCIpLFxyXG4vLyAgICAgICAgICAgICBcIllZWVktTU0tREQgSEg6bW1cIlxyXG4vLyAgICAgICAgICkuZm9ybWF0KCk7XHJcbi8vICAgICAgICAgdmFyIGR0X2lkID0gZHRfc3RhcnQgKyBcIi9cIiArIGR0X2VuZDtcclxuLy8gICAgICAgICBGaXNoRnJ5Rm9ybS5ldmVudHNbZHRfaWRdID0ge1xyXG4vLyAgICAgICAgICAgICBkdF9zdGFydDogZHRfc3RhcnQsXHJcbi8vICAgICAgICAgICAgIGR0X2VuZDogZHRfZW5kXHJcbi8vICAgICAgICAgfTtcclxuLy8gICAgICAgICAvL3VwZGF0ZSB0aGUgZGF0ZXRpbWUgbGlzdDsgY2xlYXIgaXQgb3V0IGZpcnN0XHJcbi8vICAgICAgICAgJChcIiNldmVudHNcIikuZW1wdHkoKTtcclxuLy8gICAgICAgICAvLyBhc3NlbWJsZSBhIG5ldyBldmVudCBsaXN0IHVzaW5nIHRoZSBjbGFzcyBtZXRob2RcclxuLy8gICAgICAgICBGaXNoRnJ5Rm9ybS5wdXNoVG9Gb3JtRXZlbnRzKCk7XHJcbi8vICAgICB9KTtcclxuLy8gfSk7XHJcblxyXG4vLyAvKipcclxuLy8gICogZ2VvY29kZSBmdW5jdGlvblxyXG4vLyAgKiBzdWJtaXQgdG8gZ2VvY29kZXIgYW5kIHByb3ZpZGUgZmVlZGJhY2sgdG8gdXNlciBmb3IgZXJyb3JzXHJcbi8vICAqIHRoaXMgaXMgdXNpbmcgTWFwemVuIFNlYXJjaCwgYnV0IGNvdWxkIGJlIGFueSBnZW9jb2RlclxyXG4vLyAgKi9cclxuLy8gRmlzaEZyeUZvcm1DbGFzcy5wcm90b3R5cGUuZ2VvY29kZSA9IGZ1bmN0aW9uKCkge1xyXG4vLyAgICAgLy9hc3NpZ24gdGhpcyBjbGFzcyBpbnN0YW5jZSB0byBzZWxmXHJcbi8vICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbi8vICAgICAvLyBpZiB2YWx1ZSBpcyBzb21ldGhpbmc6XHJcbi8vICAgICBpZiAoc2VsZi52ZW51ZV9hZGRyZXNzICE9PSBudWxsKSB7XHJcbi8vICAgICAgICAgLy8gc3VibWl0IHZhbHVlIHRvIGdlb2NvZGVyIHNlcnZpY2VcclxuLy8gICAgICAgICByZXR1cm4gJC5hamF4KHtcclxuLy8gICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9nZW9jb2RlL2pzb25cIixcclxuLy8gICAgICAgICAgICAgZGF0YToge1xyXG4vLyAgICAgICAgICAgICAgICAgYXBpX2tleTogXCJBSXphU3lCRXZERjd5aWdpNmRCMHRlM1NoeTI0UHNfZklBX0xQR1lcIixcclxuLy8gICAgICAgICAgICAgICAgIGFkZHJlc3M6IHNlbGYudmVudWVfYWRkcmVzc1xyXG4vLyAgICAgICAgICAgICB9LFxyXG4vLyAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXHJcbi8vICAgICAgICAgICAgIHR5cGU6IFwiR0VUXCIsXHJcbi8vICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbi8vICAgICAgICAgICAgICAgICAvLyByZXNwb25zZSBmcm9tIGdvb2dsZSBoYXMgZG9jcy1zcGVjaWZpZWQgZm9ybWF0XHJcbi8vICAgICAgICAgICAgICAgICBjb29yZHMgPSByZXNwb25zZS5yZXN1bHRzWzBdLmdlb21ldHJ5LmxvY2F0aW9uO1xyXG4vLyAgICAgICAgICAgICAgICAgc2VsZi50aGVfZ2VvbSA9IHtcclxuLy8gICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBvaW50XCIsXHJcbi8vICAgICAgICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtjb29yZHMubG5nLCBjb29yZHMubGF0XVxyXG4vLyAgICAgICAgICAgICAgICAgfTtcclxuLy8gICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYWpheCBnZW9jb2RlIHN1Y2Nlc3NcIik7XHJcbi8vICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzZWxmLnRoZV9nZW9tLmNvb3JkaW5hdGVzKTtcclxuLy8gICAgICAgICAgICAgfSxcclxuLy8gICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHhocikge1xyXG4vLyAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coeGhyKTtcclxuLy8gICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgIH0pO1xyXG4vLyAgICAgfSBlbHNlIHtcclxuLy8gICAgICAgICBhbGVydChcIllvdSBtdXN0IHByb3ZpZGUgYW4gYWRkcmVzc1wiKTtcclxuLy8gICAgIH1cclxuLy8gfTtcclxuXHJcbi8vIC8qKlxyXG4vLyAgKiBnZW9jb2RlIG9uIGdlb2NvZGUgYnV0dG9uIGNsaWNrIHVzaW5nIGVudGVyZWQgZm9ybSBkYXRhXHJcbi8vICAqL1xyXG4vLyAkKGZ1bmN0aW9uKCkge1xyXG4vLyAgICAgJChcIiN2ZW51ZV9hZGRyZXNzX2dlb2NvZGVcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcclxuLy8gICAgICAgICAvL3JlYWQgaW4gdmFsdWUgZnJvbSB2ZW51ZV9hZGRyZXNzIGZvcm0gZmllbGQgdG8gdGhlIGNsYXNzXHJcbi8vICAgICAgICAgRmlzaEZyeUZvcm0udmVudWVfYWRkcmVzcyA9ICQoXCIjdmVudWVfYWRkcmVzc1wiKS52YWwoKTtcclxuLy8gICAgICAgICAvLyBydW4gdGhlIGdlb2NvZGUgbWV0aG9kXHJcbi8vICAgICAgICAgdmFyIHJ1bkdlb2NvZGVyID0gRmlzaEZyeUZvcm0uZ2VvY29kZSgpO1xyXG4vLyAgICAgICAgIC8vIHdoZW4gaXQncyBjb21wbGV0ZSwgZ2V0IHRoZSBjb29yZGluYXRlcyBvdXQgb2YgaXQgYW5kIGFkZCB0byB0aGUgcGFnZS5cclxuLy8gICAgICAgICAkLndoZW4ocnVuR2VvY29kZXIpLmRvbmUoZnVuY3Rpb24oKSB7XHJcbi8vICAgICAgICAgICAgIHZhciB4eSA9XHJcbi8vICAgICAgICAgICAgICAgICBGaXNoRnJ5Rm9ybS50aGVfZ2VvbS5jb29yZGluYXRlc1swXSArXHJcbi8vICAgICAgICAgICAgICAgICBcIiwgXCIgK1xyXG4vLyAgICAgICAgICAgICAgICAgRmlzaEZyeUZvcm0udGhlX2dlb20uY29vcmRpbmF0ZXNbMV07XHJcbi8vICAgICAgICAgICAgIC8vIEFERCBSRVNVTFQgVE8gUEFHRSBFTEVNRU5UXHJcbi8vICAgICAgICAgICAgICQoXCIjdmVudWVfYWRkcmVzc19nZW9jb2RlZFwiKS5lbXB0eSgpO1xyXG4vLyAgICAgICAgICAgICAkKFwiI3ZlbnVlX2FkZHJlc3NfZ2VvY29kZWRcIikuYXBwZW5kKHh5KTtcclxuLy8gICAgICAgICAgICAgdmFyIGNlbnRlciA9IEwubGF0TG5nKFxyXG4vLyAgICAgICAgICAgICAgICAgRmlzaEZyeUZvcm0udGhlX2dlb20uY29vcmRpbmF0ZXNbMV0sXHJcbi8vICAgICAgICAgICAgICAgICBGaXNoRnJ5Rm9ybS50aGVfZ2VvbS5jb29yZGluYXRlc1swXVxyXG4vLyAgICAgICAgICAgICApO1xyXG4vLyAgICAgICAgICAgICBtYXAuc2V0VmlldyhjZW50ZXIsIDE1KTtcclxuLy8gICAgICAgICB9KTtcclxuLy8gICAgIH0pO1xyXG4vLyB9KTtcclxuXHJcbi8vICQoZnVuY3Rpb24oKSB7XHJcbi8vICAgICAkKFwiI2NvbmZpcm1idXR0b25cIikub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcclxuLy8gICAgICAgICBGaXNoRnJ5Rm9ybS5yZWFkRnJvbUZvcm0oKTtcclxuLy8gICAgIH0pO1xyXG4vLyB9KTtcclxuXHJcbi8vIC8qKlxyXG4vLyAgKiBpbml0YXRlIGZvcm0gc3VibWlzc2lvbi4gY2FsbHMgaW50ZXJuYWwgRmxhc2sgcm91dGUsIHdoaWNoIGhhbmRsZXNcclxuLy8gICogc3VibWlzc2lvbiBvZiBmb3JtIGRhdGEgdG8gZGF0YWJhc2UuXHJcbi8vICAqL1xyXG4vLyAkKGZ1bmN0aW9uKCkge1xyXG4vLyAgICAgJChcIiNzdWJtaXRidXR0b25cIikub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcclxuLy8gICAgICAgICAvLyByZWFkIHRoZSBmb3JtIGFuZCBnZXQgdGhlIGpzb25cclxuLy8gICAgICAgICB2YXIgZmlzaGZyeV9qc29uID0gRmlzaEZyeUZvcm0ucmV0dXJuSlNPTigpO1xyXG5cclxuLy8gICAgICAgICAvLyBMYXN0LW1pbnV0ZSBwcm9wZXJ0eSB1cGRhdGVzLi4uXHJcbi8vICAgICAgICAgLy8gY2hlY2sgaWYgdmFsaWRhdGlvbiBjaGVja2JveCBvbiBjb25maXJtYXRpb24gbW9kYWwgaXMgdHJ1ZVxyXG4vLyAgICAgICAgIGlmICgkKFwiI3ZhbGlkYXRlZFwiKS5wcm9wKFwiY2hlY2tlZFwiKSkge1xyXG4vLyAgICAgICAgICAgICBmaXNoZnJ5X2pzb24udmFsaWRhdGVkID0gdHJ1ZTtcclxuLy8gICAgICAgICB9XHJcbi8vICAgICAgICAgLy8gdGhlbiBhbHNvIGNoZWNrIGlmIGJvdGggcHVibGlzaCBjb25maXJtYXRpb25zIGhhdmUgYmVlbiBjaGVja2VkLlxyXG4vLyAgICAgICAgIC8vaWYgKCgkKCcjcHVibGlzaFRoaXMnKS5wcm9wKCdjaGVja2VkJykpICYgKCQoJyNwdWJsaXNoVGhpc1llc1JlYWxseScpLnByb3AoJ2NoZWNrZWQnKSkpIHtcclxuLy8gICAgICAgICBpZiAoJChcIiNwdWJsaXNoXCIpLnByb3AoXCJjaGVja2VkXCIpKSB7XHJcbi8vICAgICAgICAgICAgIGZpc2hmcnlfanNvbi5wdWJsaXNoID0gdHJ1ZTtcclxuLy8gICAgICAgICB9XHJcbi8vICAgICAgICAgY29uc29sZS5sb2coXCItLS1cIik7XHJcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJTdWJtaXR0ZWQgRmlzaCBGcnk6XCIpO1xyXG4vLyAgICAgICAgIGNvbnNvbGUubG9nKGZpc2hmcnlfanNvbik7XHJcbi8vICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoZmlzaGZyeV9qc29uKSk7XHJcblxyXG4vLyAgICAgICAgICQuYWpheCh7XHJcbi8vICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4vLyAgICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLThcIixcclxuLy8gICAgICAgICAgICAgLy8gdXJsOiAkU0NSSVBUX1JPT1QgKyBcIi9jb250cmlidXRlL2Zpc2hmcnkvc3VibWl0XCIsXHJcbi8vICAgICAgICAgICAgIHVybDogRmxhc2sudXJsX2Zvcignc3VibWl0X2Zpc2hmcnknKSxcclxuLy8gICAgICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoZmlzaGZyeV9qc29uKSxcclxuLy8gICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuLy8gICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic3VjY2Vzc1wiKTtcclxuLy8gICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuLy8gICAgICAgICAgICAgICAgIHZhciByID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XHJcbi8vICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyKTtcclxuLy8gICAgICAgICAgICAgICAgICQoXCIjbXlNb2RhbFwiKS5tb2RhbChcImhpZGVcIik7XHJcbi8vICAgICAgICAgICAgICAgICAkKFwiI2FsZXJ0LXN1Y2Nlc3NcIikuc2hvdygpO1xyXG4vLyAgICAgICAgICAgICAgICAgLy8gYSByZWRpcmVjdCBwYXJhbSB3aWxsIGJlIHByb3ZpZGVkIGlmIHRoZSBmaXNoIGZyeSB3YXMgbmV3XHJcbi8vICAgICAgICAgICAgICAgICBpZiAoci5yZWRpcmVjdCkge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgIC8qIHRoZSByZWRpcmVjdCBsb2FkcyB0aGUgbmV3bHkgc3VibWl0dGVkIEZpc2ggRnJ5IGludG8gdGhlIGVkaXRpbmdcclxuLy8gICAgICAgICAgICAgICAgICAgICAgKiB2ZXJzaW9uIG9mIHRoZSBmb3JtIHZpYSAnL2NvbnRyaWJ1dGUvZmlzaGZyeS88aW50OmZmX2lkPidcclxuLy8gICAgICAgICAgICAgICAgICAgICAgKi9cclxuLy8gICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSgkRmxhc2sudXJsX2ZvcignaG9tZScpICsgci5yZWRpcmVjdCk7XHJcbi8vICAgICAgICAgICAgICAgICB9XHJcbi8vICAgICAgICAgICAgIH0sXHJcbi8vICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihlcnJvcikge1xyXG4vLyAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvclwiKTtcclxuLy8gICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuLy8gICAgICAgICAgICAgICAgICQoXCIjbXlNb2RhbFwiKS5tb2RhbChcImhpZGVcIik7XHJcbi8vICAgICAgICAgICAgICAgICAkKFwiI2FsZXJ0LXdhcm5pbmdcIikuc2hvdygpO1xyXG4vLyAgICAgICAgICAgICB9XHJcbi8vICAgICAgICAgfSk7XHJcbi8vICAgICB9KTtcclxuLy8gfSk7Il19
