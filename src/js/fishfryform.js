// imports
var $ = jQuery;
var Vue = require('vue');
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
    el: '#FishFryForm',
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