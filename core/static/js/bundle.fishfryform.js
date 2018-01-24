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
var $ = jQuery;
var uuidV4 = require('uuid/v4');

/*
(function() {
    
}).call(this);
*/

var map = new L.Map("map", {
    center: [40.440734, -80.0091294],
    zoom: 10
});

function makeMap() {
    /*L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'Stamen'
      }).addTo(map);
      */
    L.tileLayer(
        //'http://{s}.sm.mapstack.stamen.com/((toner-lite,$000%5B@80%5D,$8ad3f4%5Bhsl-color%5D,mapbox-water%5Bdestination-in%5D),(toner,$fff%5Bdifference%5D,$fdb930%5Bhsl-color%5D,mapbox-water%5Bdestination-out%5D),(toner-hybrid,$fff%5Bdifference%5D,$fdb930%5Bhsl-color%5D),(terrain-background,$000%5B@40%5D,$ffffff%5Bhsl-color%5D,mapbox-water%5Bdestination-out%5D)%5Blighter@40%5D)/{z}/{x}/{y}.png',
        //'http://{s}.sm.mapstack.stamen.com/((terrain-background,$000[@30],$fff[hsl-saturation@80],$b2c4cc[hsl-color],mapbox-water[destination-in]),(watercolor,$fff[difference],$808080[hsl-color],mapbox-water[destination-out]),(terrain-background,$000[@40],$ffffff[hsl-color],mapbox-water[destination-out])[screen@60],(streets-and-labels,$fedd9a[hsl-color])[@50])/{z}/{x}/{y}.png',
        "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: 'Tiles via <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> license. Basemap data from <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a> license.'
        }
    ).addTo(map);

    // Adjust the map to zoom to the feature
    // NOTE: This needs to be replaced with a plain leaflet map that loads geojson from api/fishfries
    cartodb
        .createLayer(
            map,
            "https://christianbgass.carto.com/api/v2/viz/bbab7804-df59-11e6-925f-0e05a8b3e3d7/viz.json"
        )
        .addTo(map)
        .on("done", function(layer) {
            layer.setInteraction(true);
            layer.on("featureClick", function(e, latlng, pos, data) {
                //cartodb.log.log(e, latlng, pos, data);
                cartodb.log.log(latlng, data);
            });
            layer.on("error", function(err) {
                cartodb.log.log("error: " + err);
            });
        })
        .on("error", function(err) {
            alert("An error occurred: " + err);
        });
}

/******************************************************************************/

/**
 * FishFryFormClass - class for every venue on the Fish Fry Form.
 * @class
 */

function FishFryFormClass() {
    /**
     * CARTO fish fry venues table id
     * @type number
     */
    this.cartodb_id = null;

    /**
     * a UUID, generated by the server
     * Used to keep track of records independently, to workaround limitations of
     * the CARTO SQL API
     */
    this.uuid = null;

    /**
     * Venue Details
     */

    // "type": "string"
    this.venue_name = "";
    // "type": "string"
    this.venue_type = "";
    // "type": "string"
    this.venue_notes = "";
    // "type": "string"
    this.website = "";
    // "type": "string"
    this.email = "";
    // "type": "string"
    this.phone = "";

    /**
     * Venue Address - used for geocoding and directions
     * @type string
     * @example 10 Main Street Pittsburgh PA
     */
    this.venue_address = "";

    /**
     * geometry
     * @type geometry
     */
    //"type": "geometry"
    this.the_geom = null;

    /**
         * Event Dates/Times object (dictionary): temporary structure for storing
         * event dates and times with a UUID, to facilitate adding/removing.
         * The "event_uuid_string" placeholder is not persisted outside of the
         * current class instance.
         * @example
         * {
         *   "event_uuid_string": {
         *      "dt_start": "2017-03-21T15:00:00Z",
         *      "st_end": "2017-03-21T19:00:00Z",
         *   },
         *   "event_uuid_string": {
         *      ...
             },
         *   ...
         * }
         */
    this.events = {};

    /**
     * Event Parameters
     */
    //"type": "boolean"
    this.homemade_pierogies = null;
    //"type": "boolean"
    this.lunch = null;
    // "type": "boolean"
    this.handicap = null;
    // "type": "boolean"
    this.take_out = null;
    // "type": "boolean"
    this.alcohol = null;
    // "type": "string"
    this.menu = "";
    // "type": "string"
    this.etc = "";

    /**
     * ash wed flag - auto populated
     * @type boolan
     */
    //this.ash_wed = null;
    /**
     * good friday flag - auto populated
     * @type boolan
     */
    //this.good_fri = null;

    /**
     * Data validation flag - set to true through fishfryform
     * @type boolean
     */
    this.validated = false;

    /**
     * Data publication flag - set to true through fishfryform admin or in DB directly, once validated
     * @type boolean
     * @private
     */
    this.publish = false;
}

/**
 * FishFryForm Class loadJSON method: loads a record from the a GeoJSON
 * feature into the this class.
 */
FishFryFormClass.prototype.loadJSON = function(fishfry_json) {
    var self = this;
    // push attributes in
    var properties = fishfry_json.properties;
    for (var p in properties) {
        if (properties.hasOwnProperty(p)) {
            self[p] = properties[p];
        }
    }
    // push geometry in
    self.the_geom = fishfry_json.geometry;
};

/**
 * FishFryForm Class pushToForm method: pushes class properties to form elements.
 * This assumes that form elements have and an id that corresponds to property
 * names.
 *
 * For forms with predefined value ranges, it maps values from class to those
 * used in the form. e.g., alcohol=true : "Yes"
 */
FishFryFormClass.prototype.pushToForm = function() {
    /* for each property in the fish fry json, we are going to auto-update the
     * value in the corresponding form field
     */
    var self = this;
    var boolean_lookup = {
        true: "Yes",
        false: "No",
        null: "Unsure / N/A",
        "": "Unsure / N/A"
    };
    for (var p in self) {
        if (self.hasOwnProperty(p)) {
            //console.log(p + ": " + self[p]);

            /* skip some properties - some don't have corresponding fields, some we
             * deal with separately
             */
            if (
                $.inArray(p, [
                    "cartodb_id",
                    "events",
                    "ash_wed",
                    "good_fri",
                    "validated",
                    "publish",
                    "the_geom",
                    "uuid"
                ]) == -1
            ) {
                // handle boolean values with a lookup to get text for dropdowns
                if (
                    $.inArray(p, [
                        "alcohol",
                        "lunch",
                        "homemade_pierogies",
                        "handicap",
                        "take_out"
                    ]) != -1
                ) {
                    {
                        $("#" + p).val(boolean_lookup[self[p]]);
                    }
                    // handle boolean values for checkboxed attributes
                } else if ($.inArray(p, ["publish", "validated"]) != -1) {
                    var b = { true: true, false: false, null: false, "": false };
                    $("#" + p).prop("checked", b[self[p]]);
                    //everything else is text
                } else {
                    $("#" + p).val(self[p]);
                }
            }
        }
    }
};

/**
 * FishFryForm Class pushToFormEvents method - push events recorded in events
 * property to the form by constructing a list. Also utilized by daterangepicker.
 * Utilizes momentjs for datetime parsing
 */
FishFryFormClass.prototype.pushToFormEvents = function() {
    var self = this;
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
            '<li class="list-group-item" id="' + k + '"><div class="form-group"><div class="input-group">';
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
};

/**
 * geocode function
 * submit to geocoder and provide feedback to user for errors
 * this is using Mapzen Search, but could be any geocoder
 */
FishFryFormClass.prototype.geocode = function() {
    //assign this class instance to self
    var self = this;
    // if value is something:
    if (self.venue_address !== null) {
        // submit value to geocoder service
        return $.ajax({
            url: "https://maps.googleapis.com/maps/api/geocode/json",
            data: {
                api_key: "AIzaSyBEvDF7yigi6dB0te3Shy24Ps_fIA_LPGY",
                address: self.venue_address
            },
            cache: false,
            type: "GET",
            success: function(response) {
                // response from google has docs-specified format
                coords = response.results[0].geometry.location;
                self.the_geom = {
                    type: "Point",
                    coordinates: [coords.lng, coords.lat]
                };
                console.log("ajax geocode success");
                console.log(self.the_geom.coordinates);
            },
            error: function(xhr) {
                console.log(xhr);
            }
        });
    } else {
        alert("You must provide an address");
    }
};

/**
 * FishFryForm Class readFromForm method: reads form data into the class. Basically
 * the same as pushToForm, but instead of writing to form, uses property names
 * to get form values, then writes them back to the class.
 * This could potentially be run by an event listener on all the form fields,
 * so that the class is always updated.
 */
FishFryFormClass.prototype.readFromForm = function() {
    var self = this;
    var boolean_lookup = {
        Yes: true,
        No: false,
        "Unsure / N/A": null,
        "": null
    };
    /* run the geocoder if the user hasn't.
      var geocoded;
      if (!self.the_geom) {
        geocoded = self.geocode();
      } else {
        geocoded = self.the_geom;
      }
      */

    //$.when(geocoded).done(function() {
    for (var p in self) {
        if (self.hasOwnProperty(p)) {
            /* skip some properties - some don't have corresponding fields, some we
             * deal with separately:
             * - events are updated through the daterangepicker functions
             * - validated and published are handled in a modal as part of a
             * confirmation workflow
             * - cartodb_id and uuid aren't entered by the user
             * - ash_wed and good_fri are booleans but aren't being used right now
             * (they could be autodetected based on the event dates)
             * 
             */
            if (
                $.inArray(p, [
                    "uuid",
                    "cartodb_id",
                    "events",
                    "ash_wed",
                    "good_fri",
                    "validated",
                    "publish",
                    "the_geom"
                ]) == -1
            ) {
                // handle boolean values with a lookup to get text for dropdowns
                if (
                    $.inArray(p, [
                        "alcohol",
                        "lunch",
                        "homemade_pierogies",
                        "handicap",
                        "take_out"
                    ]) != -1
                ) {
                    self[p] = boolean_lookup[$("select#" + p).val()];
                    // everything else is text.
                } else {
                    self[p] = $("#" + p).val();
                }
            }
        }
    }
    console.log(self);
    //});
};

/**
 * FishFryForm Class return json method: returns all data stored in class
 */
FishFryFormClass.prototype.returnJSON = function() {
    var fishfry_json = {};
    for (var p in this) {
        if (this.hasOwnProperty(p)) {
            fishfry_json[p] = this[p];
        }
    }

    return fishfry_json;
};

/******************************************************************************/

/**
 * instantiate FishFryForm Class, used for all interaction with the form.
 */

var FishFryForm = new FishFryFormClass();

/******************************************************************************/

/**
 * Initiate Date/Time Picker with div element name="daterange"
 *
 * This works on an instance of FishFryFormClass; it is not a method.
 */
$(function() {
    $('input[name="daterange"]').daterangepicker({
        autoUpdateInput: false,
        timePicker: true,
        timePickerIncrement: 15,
        timePicker24Hour: false,
        opens: "left",
        locale: {
            cancelLabel: "Clear"
        }
    });

    $('input[name="daterange"]').on("apply.daterangepicker", function(
        ev,
        picker
    ) {
        $(this).val(
            picker.startDate.format("YYYY-MM-DD HH:mm") +
            " - " +
            picker.endDate.format("YYYY-MM-DD HH:mm")
        );
    });

    $('input[name="daterange"]').on("cancel.daterangepicker", function(
        ev,
        picker
    ) {
        console.log("cancel datetime selection");
        $(this).val("");
    });

    /**
     * add datetime to list on button click using datetimepicker form data
     */
    $('input[name="daterange"]').on("apply.daterangepicker", function(
        evt,
        picker
    ) {
        // read in value from the picker and push to the FishFryForm class instance.
        //var id = uuid.v4();
        var dt_start = moment(
            picker.startDate.format("YYYY-MM-DD HH:mm"),
            "YYYY-MM-DD HH:mm"
        ).format();
        var dt_end = moment(
            picker.endDate.format("YYYY-MM-DD HH:mm"),
            "YYYY-MM-DD HH:mm"
        ).format();
        var dt_id = dt_start + "/" + dt_end;
        FishFryForm.events[dt_id] = {
            dt_start: dt_start,
            dt_end: dt_end
        };
        //update the datetime list; clear it out first
        $("#events").empty();
        // assemble a new event list using the class method
        FishFryForm.pushToFormEvents();
    });
});

/**
 * geocode on geocode button click using entered form data
 */
$(function() {
    $("#venue_address_geocode").on("click", function() {
        //read in value from venue_address form field to the class
        FishFryForm.venue_address = $("#venue_address").val();
        // run the geocode method
        var runGeocoder = FishFryForm.geocode();
        // when it's complete, get the coordinates out of it and add to the page.
        $.when(runGeocoder).done(function() {
            var xy =
                FishFryForm.the_geom.coordinates[0] +
                ", " +
                FishFryForm.the_geom.coordinates[1];
            // ADD RESULT TO PAGE ELEMENT
            $("#venue_address_geocoded").empty();
            $("#venue_address_geocoded").append(xy);
            var center = L.latLng(
                FishFryForm.the_geom.coordinates[1],
                FishFryForm.the_geom.coordinates[0]
            );
            map.setView(center, 15);
        });
    });
});

/**
 * on confirm button click, the modal will open. It also fires the method
 * to read all the data from the form.
 */
$(function() {
    $("#confirmbutton").on("click", function() {
        FishFryForm.readFromForm();
    });
});

/**
 * on checking of publish box, show the publish confirmation
 *
$('#publishThis input:checkbox').change(function() {
    if ($(this).attr("checked")) {
      console.log("checked");
      $('#publishConfirmation').show();
    } else {
      console.log("unchecked");
      $('#publishConfirmation').hide();
    }
});
*/
/**
 * disable publish checkbox unless validate is checked
 *
$('#publishThis input:checkbox').change(function() {
    if ($(this).is(":checked")) {
      console.log("checked");
      $('#publishThis').prop('disabled', false);
    } else {
      console.log("unchecked");
      $('#publishThis').prop('disabled', true);
    }
});
*/

/**
 * initate form submission. calls internal Flask route, which handles
 * submission of form data to database.
 */
$(function() {
    $("#submitbutton").on("click", function() {
        // read the form and get the json
        var fishfry_json = FishFryForm.returnJSON();

        // Last-minute property updates...
        // check if validation checkbox on confirmation modal is true
        if ($("#validated").prop("checked")) {
            fishfry_json.validated = true;
        }
        // then also check if both publish confirmations have been checked.
        //if (($('#publishThis').prop('checked')) & ($('#publishThisYesReally').prop('checked'))) {
        if ($("#publish").prop("checked")) {
            fishfry_json.publish = true;
        }
        console.log("---");
        console.log("Submitted Fish Fry:");
        console.log(fishfry_json);
        console.log(JSON.stringify(fishfry_json));

        $.ajax({
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            // url: $SCRIPT_ROOT + "/contribute/fishfry/submit",
            url: Flask.url_for('submit_fishfry'),
            data: JSON.stringify(fishfry_json),
            success: function(response) {
                console.log("success");
                console.log(response);
                var r = JSON.parse(response);
                console.log(r);
                $("#myModal").modal("hide");
                $("#alert-success").show();
                // a redirect param will be provided if the fish fry was new
                if (r.redirect) {
                    /* the redirect loads the newly submitted Fish Fry into the editing
                     * version of the form via '/contribute/fishfry/<int:ff_id>'
                     */
                    window.location.replace($Flask.url_for('home') + r.redirect);
                }
            },
            error: function(error) {
                console.log("error");
                console.log(error);
                $("#myModal").modal("hide");
                $("#alert-warning").show();
            }
        });
    });
});

/**
 * Note that deletion via the form is handled through a POST request, via a
 * form field and Flask - not in this script
 */
},{"uuid/v4":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvdXVpZC9saWIvYnl0ZXNUb1V1aWQuanMiLCJub2RlX21vZHVsZXMvdXVpZC9saWIvcm5nLWJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXVpZC92NC5qcyIsInNyYy9qcy9kYXRhZm9ybS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENvbnZlcnQgYXJyYXkgb2YgMTYgYnl0ZSB2YWx1ZXMgdG8gVVVJRCBzdHJpbmcgZm9ybWF0IG9mIHRoZSBmb3JtOlxuICogWFhYWFhYWFgtWFhYWC1YWFhYLVhYWFgtWFhYWFhYWFhYWFhYXG4gKi9cbnZhciBieXRlVG9IZXggPSBbXTtcbmZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyArK2kpIHtcbiAgYnl0ZVRvSGV4W2ldID0gKGkgKyAweDEwMCkudG9TdHJpbmcoMTYpLnN1YnN0cigxKTtcbn1cblxuZnVuY3Rpb24gYnl0ZXNUb1V1aWQoYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBvZmZzZXQgfHwgMDtcbiAgdmFyIGJ0aCA9IGJ5dGVUb0hleDtcbiAgcmV0dXJuIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBieXRlc1RvVXVpZDtcbiIsIi8vIFVuaXF1ZSBJRCBjcmVhdGlvbiByZXF1aXJlcyBhIGhpZ2ggcXVhbGl0eSByYW5kb20gIyBnZW5lcmF0b3IuICBJbiB0aGVcbi8vIGJyb3dzZXIgdGhpcyBpcyBhIGxpdHRsZSBjb21wbGljYXRlZCBkdWUgdG8gdW5rbm93biBxdWFsaXR5IG9mIE1hdGgucmFuZG9tKClcbi8vIGFuZCBpbmNvbnNpc3RlbnQgc3VwcG9ydCBmb3IgdGhlIGBjcnlwdG9gIEFQSS4gIFdlIGRvIHRoZSBiZXN0IHdlIGNhbiB2aWFcbi8vIGZlYXR1cmUtZGV0ZWN0aW9uXG5cbi8vIGdldFJhbmRvbVZhbHVlcyBuZWVkcyB0byBiZSBpbnZva2VkIGluIGEgY29udGV4dCB3aGVyZSBcInRoaXNcIiBpcyBhIENyeXB0byBpbXBsZW1lbnRhdGlvbi5cbnZhciBnZXRSYW5kb21WYWx1ZXMgPSAodHlwZW9mKGNyeXB0bykgIT0gJ3VuZGVmaW5lZCcgJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcy5iaW5kKGNyeXB0bykpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgKHR5cGVvZihtc0NyeXB0bykgIT0gJ3VuZGVmaW5lZCcgJiYgbXNDcnlwdG8uZ2V0UmFuZG9tVmFsdWVzLmJpbmQobXNDcnlwdG8pKTtcbmlmIChnZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0byBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIHZhciBybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGdldFJhbmRvbVZhbHVlcyhybmRzOCk7XG4gICAgcmV0dXJuIHJuZHM4O1xuICB9O1xufSBlbHNlIHtcbiAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAvL1xuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIE1hdGgucmFuZG9tKCkuICBJdCdzIGZhc3QsIGJ1dCBpcyBvZiB1bnNwZWNpZmllZFxuICAvLyBxdWFsaXR5LlxuICB2YXIgcm5kcyA9IG5ldyBBcnJheSgxNik7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtYXRoUk5HKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCByOyBpIDwgMTY7IGkrKykge1xuICAgICAgaWYgKChpICYgMHgwMykgPT09IDApIHIgPSBNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwMDA7XG4gICAgICBybmRzW2ldID0gciA+Pj4gKChpICYgMHgwMykgPDwgMykgJiAweGZmO1xuICAgIH1cblxuICAgIHJldHVybiBybmRzO1xuICB9O1xufVxuIiwidmFyIHJuZyA9IHJlcXVpcmUoJy4vbGliL3JuZycpO1xudmFyIGJ5dGVzVG9VdWlkID0gcmVxdWlyZSgnLi9saWIvYnl0ZXNUb1V1aWQnKTtcblxuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG5cbiAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xuICAgIGJ1ZiA9IG9wdGlvbnMgPT09ICdiaW5hcnknID8gbmV3IEFycmF5KDE2KSA6IG51bGw7XG4gICAgb3B0aW9ucyA9IG51bGw7XG4gIH1cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIHJuZHMgPSBvcHRpb25zLnJhbmRvbSB8fCAob3B0aW9ucy5ybmcgfHwgcm5nKSgpO1xuXG4gIC8vIFBlciA0LjQsIHNldCBiaXRzIGZvciB2ZXJzaW9uIGFuZCBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGBcbiAgcm5kc1s2XSA9IChybmRzWzZdICYgMHgwZikgfCAweDQwO1xuICBybmRzWzhdID0gKHJuZHNbOF0gJiAweDNmKSB8IDB4ODA7XG5cbiAgLy8gQ29weSBieXRlcyB0byBidWZmZXIsIGlmIHByb3ZpZGVkXG4gIGlmIChidWYpIHtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgMTY7ICsraWkpIHtcbiAgICAgIGJ1ZltpICsgaWldID0gcm5kc1tpaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZiB8fCBieXRlc1RvVXVpZChybmRzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB2NDtcbiIsInZhciAkID0galF1ZXJ5O1xyXG52YXIgdXVpZFY0ID0gcmVxdWlyZSgndXVpZC92NCcpO1xyXG5cclxuLypcclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgXHJcbn0pLmNhbGwodGhpcyk7XHJcbiovXHJcblxyXG52YXIgbWFwID0gbmV3IEwuTWFwKFwibWFwXCIsIHtcclxuICAgIGNlbnRlcjogWzQwLjQ0MDczNCwgLTgwLjAwOTEyOTRdLFxyXG4gICAgem9vbTogMTBcclxufSk7XHJcblxyXG5mdW5jdGlvbiBtYWtlTWFwKCkge1xyXG4gICAgLypMLnRpbGVMYXllcignaHR0cDovL3RpbGUuc3RhbWVuLmNvbS90b25lci97en0ve3h9L3t5fS5wbmcnLCB7XHJcbiAgICAgICAgYXR0cmlidXRpb246ICdTdGFtZW4nXHJcbiAgICAgIH0pLmFkZFRvKG1hcCk7XHJcbiAgICAgICovXHJcbiAgICBMLnRpbGVMYXllcihcclxuICAgICAgICAvLydodHRwOi8ve3N9LnNtLm1hcHN0YWNrLnN0YW1lbi5jb20vKCh0b25lci1saXRlLCQwMDAlNUJAODAlNUQsJDhhZDNmNCU1QmhzbC1jb2xvciU1RCxtYXBib3gtd2F0ZXIlNUJkZXN0aW5hdGlvbi1pbiU1RCksKHRvbmVyLCRmZmYlNUJkaWZmZXJlbmNlJTVELCRmZGI5MzAlNUJoc2wtY29sb3IlNUQsbWFwYm94LXdhdGVyJTVCZGVzdGluYXRpb24tb3V0JTVEKSwodG9uZXItaHlicmlkLCRmZmYlNUJkaWZmZXJlbmNlJTVELCRmZGI5MzAlNUJoc2wtY29sb3IlNUQpLCh0ZXJyYWluLWJhY2tncm91bmQsJDAwMCU1QkA0MCU1RCwkZmZmZmZmJTVCaHNsLWNvbG9yJTVELG1hcGJveC13YXRlciU1QmRlc3RpbmF0aW9uLW91dCU1RCklNUJsaWdodGVyQDQwJTVEKS97en0ve3h9L3t5fS5wbmcnLFxyXG4gICAgICAgIC8vJ2h0dHA6Ly97c30uc20ubWFwc3RhY2suc3RhbWVuLmNvbS8oKHRlcnJhaW4tYmFja2dyb3VuZCwkMDAwW0AzMF0sJGZmZltoc2wtc2F0dXJhdGlvbkA4MF0sJGIyYzRjY1toc2wtY29sb3JdLG1hcGJveC13YXRlcltkZXN0aW5hdGlvbi1pbl0pLCh3YXRlcmNvbG9yLCRmZmZbZGlmZmVyZW5jZV0sJDgwODA4MFtoc2wtY29sb3JdLG1hcGJveC13YXRlcltkZXN0aW5hdGlvbi1vdXRdKSwodGVycmFpbi1iYWNrZ3JvdW5kLCQwMDBbQDQwXSwkZmZmZmZmW2hzbC1jb2xvcl0sbWFwYm94LXdhdGVyW2Rlc3RpbmF0aW9uLW91dF0pW3NjcmVlbkA2MF0sKHN0cmVldHMtYW5kLWxhYmVscywkZmVkZDlhW2hzbC1jb2xvcl0pW0A1MF0pL3t6fS97eH0ve3l9LnBuZycsXHJcbiAgICAgICAgXCJodHRwczovL2NhcnRvZGItYmFzZW1hcHMte3N9Lmdsb2JhbC5zc2wuZmFzdGx5Lm5ldC9saWdodF9hbGwve3p9L3t4fS97eX0ucG5nXCIsIHtcclxuICAgICAgICAgICAgbWF4Wm9vbTogMTgsXHJcbiAgICAgICAgICAgIGF0dHJpYnV0aW9uOiAnVGlsZXMgdmlhIDxhIGhyZWY9XCJodHRwOi8vc3RhbWVuLmNvbVwiPlN0YW1lbiBEZXNpZ248L2E+LCB1bmRlciA8YSBocmVmPVwiaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnkvMy4wXCI+Q0MgQlkgMy4wPC9hPiBsaWNlbnNlLiBCYXNlbWFwIGRhdGEgZnJvbSA8YSBocmVmPVwiaHR0cDovL29wZW5zdHJlZXRtYXAub3JnXCI+T3BlblN0cmVldE1hcDwvYT4sIHVuZGVyIDxhIGhyZWY9XCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjBcIj5DQyBCWSBTQTwvYT4gbGljZW5zZS4nXHJcbiAgICAgICAgfVxyXG4gICAgKS5hZGRUbyhtYXApO1xyXG5cclxuICAgIC8vIEFkanVzdCB0aGUgbWFwIHRvIHpvb20gdG8gdGhlIGZlYXR1cmVcclxuICAgIC8vIE5PVEU6IFRoaXMgbmVlZHMgdG8gYmUgcmVwbGFjZWQgd2l0aCBhIHBsYWluIGxlYWZsZXQgbWFwIHRoYXQgbG9hZHMgZ2VvanNvbiBmcm9tIGFwaS9maXNoZnJpZXNcclxuICAgIGNhcnRvZGJcclxuICAgICAgICAuY3JlYXRlTGF5ZXIoXHJcbiAgICAgICAgICAgIG1hcCxcclxuICAgICAgICAgICAgXCJodHRwczovL2NocmlzdGlhbmJnYXNzLmNhcnRvLmNvbS9hcGkvdjIvdml6L2JiYWI3ODA0LWRmNTktMTFlNi05MjVmLTBlMDVhOGIzZTNkNy92aXouanNvblwiXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5hZGRUbyhtYXApXHJcbiAgICAgICAgLm9uKFwiZG9uZVwiLCBmdW5jdGlvbihsYXllcikge1xyXG4gICAgICAgICAgICBsYXllci5zZXRJbnRlcmFjdGlvbih0cnVlKTtcclxuICAgICAgICAgICAgbGF5ZXIub24oXCJmZWF0dXJlQ2xpY2tcIiwgZnVuY3Rpb24oZSwgbGF0bG5nLCBwb3MsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIC8vY2FydG9kYi5sb2cubG9nKGUsIGxhdGxuZywgcG9zLCBkYXRhKTtcclxuICAgICAgICAgICAgICAgIGNhcnRvZGIubG9nLmxvZyhsYXRsbmcsIGRhdGEpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgbGF5ZXIub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNhcnRvZGIubG9nLmxvZyhcImVycm9yOiBcIiArIGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiQW4gZXJyb3Igb2NjdXJyZWQ6IFwiICsgZXJyKTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbi8qKlxyXG4gKiBGaXNoRnJ5Rm9ybUNsYXNzIC0gY2xhc3MgZm9yIGV2ZXJ5IHZlbnVlIG9uIHRoZSBGaXNoIEZyeSBGb3JtLlxyXG4gKiBAY2xhc3NcclxuICovXHJcblxyXG5mdW5jdGlvbiBGaXNoRnJ5Rm9ybUNsYXNzKCkge1xyXG4gICAgLyoqXHJcbiAgICAgKiBDQVJUTyBmaXNoIGZyeSB2ZW51ZXMgdGFibGUgaWRcclxuICAgICAqIEB0eXBlIG51bWJlclxyXG4gICAgICovXHJcbiAgICB0aGlzLmNhcnRvZGJfaWQgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogYSBVVUlELCBnZW5lcmF0ZWQgYnkgdGhlIHNlcnZlclxyXG4gICAgICogVXNlZCB0byBrZWVwIHRyYWNrIG9mIHJlY29yZHMgaW5kZXBlbmRlbnRseSwgdG8gd29ya2Fyb3VuZCBsaW1pdGF0aW9ucyBvZlxyXG4gICAgICogdGhlIENBUlRPIFNRTCBBUElcclxuICAgICAqL1xyXG4gICAgdGhpcy51dWlkID0gbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFZlbnVlIERldGFpbHNcclxuICAgICAqL1xyXG5cclxuICAgIC8vIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICB0aGlzLnZlbnVlX25hbWUgPSBcIlwiO1xyXG4gICAgLy8gXCJ0eXBlXCI6IFwic3RyaW5nXCJcclxuICAgIHRoaXMudmVudWVfdHlwZSA9IFwiXCI7XHJcbiAgICAvLyBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgdGhpcy52ZW51ZV9ub3RlcyA9IFwiXCI7XHJcbiAgICAvLyBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgdGhpcy53ZWJzaXRlID0gXCJcIjtcclxuICAgIC8vIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICB0aGlzLmVtYWlsID0gXCJcIjtcclxuICAgIC8vIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICB0aGlzLnBob25lID0gXCJcIjtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFZlbnVlIEFkZHJlc3MgLSB1c2VkIGZvciBnZW9jb2RpbmcgYW5kIGRpcmVjdGlvbnNcclxuICAgICAqIEB0eXBlIHN0cmluZ1xyXG4gICAgICogQGV4YW1wbGUgMTAgTWFpbiBTdHJlZXQgUGl0dHNidXJnaCBQQVxyXG4gICAgICovXHJcbiAgICB0aGlzLnZlbnVlX2FkZHJlc3MgPSBcIlwiO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogZ2VvbWV0cnlcclxuICAgICAqIEB0eXBlIGdlb21ldHJ5XHJcbiAgICAgKi9cclxuICAgIC8vXCJ0eXBlXCI6IFwiZ2VvbWV0cnlcIlxyXG4gICAgdGhpcy50aGVfZ2VvbSA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgICogRXZlbnQgRGF0ZXMvVGltZXMgb2JqZWN0IChkaWN0aW9uYXJ5KTogdGVtcG9yYXJ5IHN0cnVjdHVyZSBmb3Igc3RvcmluZ1xyXG4gICAgICAgICAqIGV2ZW50IGRhdGVzIGFuZCB0aW1lcyB3aXRoIGEgVVVJRCwgdG8gZmFjaWxpdGF0ZSBhZGRpbmcvcmVtb3ZpbmcuXHJcbiAgICAgICAgICogVGhlIFwiZXZlbnRfdXVpZF9zdHJpbmdcIiBwbGFjZWhvbGRlciBpcyBub3QgcGVyc2lzdGVkIG91dHNpZGUgb2YgdGhlXHJcbiAgICAgICAgICogY3VycmVudCBjbGFzcyBpbnN0YW5jZS5cclxuICAgICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAgICAqIHtcclxuICAgICAgICAgKiAgIFwiZXZlbnRfdXVpZF9zdHJpbmdcIjoge1xyXG4gICAgICAgICAqICAgICAgXCJkdF9zdGFydFwiOiBcIjIwMTctMDMtMjFUMTU6MDA6MDBaXCIsXHJcbiAgICAgICAgICogICAgICBcInN0X2VuZFwiOiBcIjIwMTctMDMtMjFUMTk6MDA6MDBaXCIsXHJcbiAgICAgICAgICogICB9LFxyXG4gICAgICAgICAqICAgXCJldmVudF91dWlkX3N0cmluZ1wiOiB7XHJcbiAgICAgICAgICogICAgICAuLi5cclxuICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICogICAuLi5cclxuICAgICAgICAgKiB9XHJcbiAgICAgICAgICovXHJcbiAgICB0aGlzLmV2ZW50cyA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXZlbnQgUGFyYW1ldGVyc1xyXG4gICAgICovXHJcbiAgICAvL1widHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgdGhpcy5ob21lbWFkZV9waWVyb2dpZXMgPSBudWxsO1xyXG4gICAgLy9cInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgIHRoaXMubHVuY2ggPSBudWxsO1xyXG4gICAgLy8gXCJ0eXBlXCI6IFwiYm9vbGVhblwiXHJcbiAgICB0aGlzLmhhbmRpY2FwID0gbnVsbDtcclxuICAgIC8vIFwidHlwZVwiOiBcImJvb2xlYW5cIlxyXG4gICAgdGhpcy50YWtlX291dCA9IG51bGw7XHJcbiAgICAvLyBcInR5cGVcIjogXCJib29sZWFuXCJcclxuICAgIHRoaXMuYWxjb2hvbCA9IG51bGw7XHJcbiAgICAvLyBcInR5cGVcIjogXCJzdHJpbmdcIlxyXG4gICAgdGhpcy5tZW51ID0gXCJcIjtcclxuICAgIC8vIFwidHlwZVwiOiBcInN0cmluZ1wiXHJcbiAgICB0aGlzLmV0YyA9IFwiXCI7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhc2ggd2VkIGZsYWcgLSBhdXRvIHBvcHVsYXRlZFxyXG4gICAgICogQHR5cGUgYm9vbGFuXHJcbiAgICAgKi9cclxuICAgIC8vdGhpcy5hc2hfd2VkID0gbnVsbDtcclxuICAgIC8qKlxyXG4gICAgICogZ29vZCBmcmlkYXkgZmxhZyAtIGF1dG8gcG9wdWxhdGVkXHJcbiAgICAgKiBAdHlwZSBib29sYW5cclxuICAgICAqL1xyXG4gICAgLy90aGlzLmdvb2RfZnJpID0gbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERhdGEgdmFsaWRhdGlvbiBmbGFnIC0gc2V0IHRvIHRydWUgdGhyb3VnaCBmaXNoZnJ5Zm9ybVxyXG4gICAgICogQHR5cGUgYm9vbGVhblxyXG4gICAgICovXHJcbiAgICB0aGlzLnZhbGlkYXRlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGF0YSBwdWJsaWNhdGlvbiBmbGFnIC0gc2V0IHRvIHRydWUgdGhyb3VnaCBmaXNoZnJ5Zm9ybSBhZG1pbiBvciBpbiBEQiBkaXJlY3RseSwgb25jZSB2YWxpZGF0ZWRcclxuICAgICAqIEB0eXBlIGJvb2xlYW5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMucHVibGlzaCA9IGZhbHNlO1xyXG59XHJcblxyXG4vKipcclxuICogRmlzaEZyeUZvcm0gQ2xhc3MgbG9hZEpTT04gbWV0aG9kOiBsb2FkcyBhIHJlY29yZCBmcm9tIHRoZSBhIEdlb0pTT05cclxuICogZmVhdHVyZSBpbnRvIHRoZSB0aGlzIGNsYXNzLlxyXG4gKi9cclxuRmlzaEZyeUZvcm1DbGFzcy5wcm90b3R5cGUubG9hZEpTT04gPSBmdW5jdGlvbihmaXNoZnJ5X2pzb24pIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIC8vIHB1c2ggYXR0cmlidXRlcyBpblxyXG4gICAgdmFyIHByb3BlcnRpZXMgPSBmaXNoZnJ5X2pzb24ucHJvcGVydGllcztcclxuICAgIGZvciAodmFyIHAgaW4gcHJvcGVydGllcykge1xyXG4gICAgICAgIGlmIChwcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KHApKSB7XHJcbiAgICAgICAgICAgIHNlbGZbcF0gPSBwcm9wZXJ0aWVzW3BdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIHB1c2ggZ2VvbWV0cnkgaW5cclxuICAgIHNlbGYudGhlX2dlb20gPSBmaXNoZnJ5X2pzb24uZ2VvbWV0cnk7XHJcbn07XHJcblxyXG4vKipcclxuICogRmlzaEZyeUZvcm0gQ2xhc3MgcHVzaFRvRm9ybSBtZXRob2Q6IHB1c2hlcyBjbGFzcyBwcm9wZXJ0aWVzIHRvIGZvcm0gZWxlbWVudHMuXHJcbiAqIFRoaXMgYXNzdW1lcyB0aGF0IGZvcm0gZWxlbWVudHMgaGF2ZSBhbmQgYW4gaWQgdGhhdCBjb3JyZXNwb25kcyB0byBwcm9wZXJ0eVxyXG4gKiBuYW1lcy5cclxuICpcclxuICogRm9yIGZvcm1zIHdpdGggcHJlZGVmaW5lZCB2YWx1ZSByYW5nZXMsIGl0IG1hcHMgdmFsdWVzIGZyb20gY2xhc3MgdG8gdGhvc2VcclxuICogdXNlZCBpbiB0aGUgZm9ybS4gZS5nLiwgYWxjb2hvbD10cnVlIDogXCJZZXNcIlxyXG4gKi9cclxuRmlzaEZyeUZvcm1DbGFzcy5wcm90b3R5cGUucHVzaFRvRm9ybSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLyogZm9yIGVhY2ggcHJvcGVydHkgaW4gdGhlIGZpc2ggZnJ5IGpzb24sIHdlIGFyZSBnb2luZyB0byBhdXRvLXVwZGF0ZSB0aGVcclxuICAgICAqIHZhbHVlIGluIHRoZSBjb3JyZXNwb25kaW5nIGZvcm0gZmllbGRcclxuICAgICAqL1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGJvb2xlYW5fbG9va3VwID0ge1xyXG4gICAgICAgIHRydWU6IFwiWWVzXCIsXHJcbiAgICAgICAgZmFsc2U6IFwiTm9cIixcclxuICAgICAgICBudWxsOiBcIlVuc3VyZSAvIE4vQVwiLFxyXG4gICAgICAgIFwiXCI6IFwiVW5zdXJlIC8gTi9BXCJcclxuICAgIH07XHJcbiAgICBmb3IgKHZhciBwIGluIHNlbGYpIHtcclxuICAgICAgICBpZiAoc2VsZi5oYXNPd25Qcm9wZXJ0eShwKSkge1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKHAgKyBcIjogXCIgKyBzZWxmW3BdKTtcclxuXHJcbiAgICAgICAgICAgIC8qIHNraXAgc29tZSBwcm9wZXJ0aWVzIC0gc29tZSBkb24ndCBoYXZlIGNvcnJlc3BvbmRpbmcgZmllbGRzLCBzb21lIHdlXHJcbiAgICAgICAgICAgICAqIGRlYWwgd2l0aCBzZXBhcmF0ZWx5XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAkLmluQXJyYXkocCwgW1xyXG4gICAgICAgICAgICAgICAgICAgIFwiY2FydG9kYl9pZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZXZlbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJhc2hfd2VkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJnb29kX2ZyaVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwidmFsaWRhdGVkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwdWJsaXNoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ0aGVfZ2VvbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwidXVpZFwiXHJcbiAgICAgICAgICAgICAgICBdKSA9PSAtMVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSBib29sZWFuIHZhbHVlcyB3aXRoIGEgbG9va3VwIHRvIGdldCB0ZXh0IGZvciBkcm9wZG93bnNcclxuICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAkLmluQXJyYXkocCwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFsY29ob2xcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsdW5jaFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImhvbWVtYWRlX3BpZXJvZ2llc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImhhbmRpY2FwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGFrZV9vdXRcIlxyXG4gICAgICAgICAgICAgICAgICAgIF0pICE9IC0xXHJcbiAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoXCIjXCIgKyBwKS52YWwoYm9vbGVhbl9sb29rdXBbc2VsZltwXV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGUgYm9vbGVhbiB2YWx1ZXMgZm9yIGNoZWNrYm94ZWQgYXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgkLmluQXJyYXkocCwgW1wicHVibGlzaFwiLCBcInZhbGlkYXRlZFwiXSkgIT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYiA9IHsgdHJ1ZTogdHJ1ZSwgZmFsc2U6IGZhbHNlLCBudWxsOiBmYWxzZSwgXCJcIjogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiI1wiICsgcCkucHJvcChcImNoZWNrZWRcIiwgYltzZWxmW3BdXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9ldmVyeXRoaW5nIGVsc2UgaXMgdGV4dFxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiI1wiICsgcCkudmFsKHNlbGZbcF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZpc2hGcnlGb3JtIENsYXNzIHB1c2hUb0Zvcm1FdmVudHMgbWV0aG9kIC0gcHVzaCBldmVudHMgcmVjb3JkZWQgaW4gZXZlbnRzXHJcbiAqIHByb3BlcnR5IHRvIHRoZSBmb3JtIGJ5IGNvbnN0cnVjdGluZyBhIGxpc3QuIEFsc28gdXRpbGl6ZWQgYnkgZGF0ZXJhbmdlcGlja2VyLlxyXG4gKiBVdGlsaXplcyBtb21lbnRqcyBmb3IgZGF0ZXRpbWUgcGFyc2luZ1xyXG4gKi9cclxuRmlzaEZyeUZvcm1DbGFzcy5wcm90b3R5cGUucHVzaFRvRm9ybUV2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgLy8gdXBkYXRlIHRoZSBkYXRldGltZSBsaXN0OyBjbGVhciBpdCBvdXQgZmlyc3RcclxuICAgICQoXCIjZXZlbnRzXCIpLmVtcHR5KCk7XHJcbiAgICAvLyAoZnV0dXJlIC0gY2hlY2sgVVVJRHMgYW5kIGFkZC9yZW1vdmUgYmFzZWQgb24gbWF0Y2hpbmcpXHJcbiAgICAvLyBhc3NlbWJsZSBhIG5ldyBvbmUgYW5kXHJcbiAgICAkLmVhY2goc2VsZi5ldmVudHMsIGZ1bmN0aW9uKGssIHYpIHtcclxuICAgICAgICAvL2NvbnZlcnQgZGF0ZS90aW1lIHRvIHJlYWRhYmxlIGZvcm1hdCAob25seSBmb3IgZGlzcGxheTsgY2xhc3MgdmFsdWUgcmVtYWlucylcclxuICAgICAgICB2YXIgZXZlbnRfc3RhcnQgPSBtb21lbnQodi5kdF9zdGFydCkuZm9ybWF0KFwiWVlZWS1NTS1ERCBISDptbVwiKTtcclxuICAgICAgICB2YXIgZXZlbnRfZW5kID0gbW9tZW50KHYuZHRfZW5kKS5mb3JtYXQoXCJZWVlZLU1NLUREIEhIOm1tXCIpO1xyXG5cclxuICAgICAgICAvLyB3cml0ZSBVVUlEIGFzIGVsZW1lbnQgSUQgZmllbGQ7IHVzZWQgdG8gbWFuYWdlIHVwZGF0ZXMuXHJcbiAgICAgICAgdmFyIGV2ZW50X2R0X2xpID1cclxuICAgICAgICAgICAgJzxsaSBjbGFzcz1cImxpc3QtZ3JvdXAtaXRlbVwiIGlkPVwiJyArIGsgKyAnXCI+PGRpdiBjbGFzcz1cImZvcm0tZ3JvdXBcIj48ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXBcIj4nO1xyXG4gICAgICAgIC8vIGFkZCBzdGFydCBhbmQgZW5kIHRpbWUgdG8gdGhlIGxpc3RcclxuICAgICAgICBldmVudF9kdF9saSArPVxyXG4gICAgICAgICAgICAnPGlucHV0IGRpc2FibGVkPVwiZGlzYWJsZWRcIiB0eXBlPVwidGV4dFwiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgdmFsdWU9XCInICtcclxuICAgICAgICAgICAgZXZlbnRfc3RhcnQgK1xyXG4gICAgICAgICAgICBcIiZtZGFzaDtcIiArXHJcbiAgICAgICAgICAgIGV2ZW50X2VuZCArXHJcbiAgICAgICAgICAgICdcIj4nO1xyXG4gICAgICAgIGV2ZW50X2R0X2xpICs9XHJcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImlucHV0LWdyb3VwLWJ0blwiPjxidXR0b24gbmFtZT1cInJlbW92ZV9kdFwiIGlkPVwiJyArXHJcbiAgICAgICAgICAgIGsgK1xyXG4gICAgICAgICAgICAnXCJjbGFzcz1cImJ0biBidG4tZGFuZ2VyXCIgdHlwZT1cImJ1dHRvblwiPjxzcGFuIGNsYXNzPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1yZW1vdmVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2J1dHRvbj48L3NwYW4+JztcclxuICAgICAgICBldmVudF9kdF9saSArPSBcIjwvZGl2PjwvZGl2PjwvbGk+XCI7XHJcblxyXG4gICAgICAgIC8vIEFERCBSRVNVTFQgVE8gUEFHRSBFTEVNRU5UXHJcbiAgICAgICAgJChcIiNldmVudHNcIikuYXBwZW5kKGV2ZW50X2R0X2xpKTtcclxuXHJcbiAgICAgICAgLy8gYmluZCBhIHJlbW92ZSBmdW5jdGlvbiAocm0gZGF0ZXRpbWUgZnJvbSBsaXN0IG9uIFwiWFwiIGJ1dHRvbiBjbGljaylcclxuICAgICAgICAkKFwiYnV0dG9uW2lkPSdcIiArIGsgKyBcIiddXCIpLmJpbmQoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBVSSBpdGVtXHJcbiAgICAgICAgICAgICQodGhpcylcclxuICAgICAgICAgICAgICAgIC5jbG9zZXN0KFwiLmxpc3QtZ3JvdXAtaXRlbVwiKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIGNsYXNzIGl0ZW1cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgICAgICAgICBcIlJlbW92ZWQgXCIgKyBKU09OLnN0cmluZ2lmeShzZWxmLmV2ZW50c1trXSkgKyBcIiBmcm9tIGV2ZW50cyBsaXN0LlwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBzZWxmLmV2ZW50c1trXTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG4gICAgLy9jb25zb2xlLmxvZyhzZWxmLmV2ZW50cyk7XHJcbn07XHJcblxyXG4vKipcclxuICogZ2VvY29kZSBmdW5jdGlvblxyXG4gKiBzdWJtaXQgdG8gZ2VvY29kZXIgYW5kIHByb3ZpZGUgZmVlZGJhY2sgdG8gdXNlciBmb3IgZXJyb3JzXHJcbiAqIHRoaXMgaXMgdXNpbmcgTWFwemVuIFNlYXJjaCwgYnV0IGNvdWxkIGJlIGFueSBnZW9jb2RlclxyXG4gKi9cclxuRmlzaEZyeUZvcm1DbGFzcy5wcm90b3R5cGUuZ2VvY29kZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9hc3NpZ24gdGhpcyBjbGFzcyBpbnN0YW5jZSB0byBzZWxmXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAvLyBpZiB2YWx1ZSBpcyBzb21ldGhpbmc6XHJcbiAgICBpZiAoc2VsZi52ZW51ZV9hZGRyZXNzICE9PSBudWxsKSB7XHJcbiAgICAgICAgLy8gc3VibWl0IHZhbHVlIHRvIGdlb2NvZGVyIHNlcnZpY2VcclxuICAgICAgICByZXR1cm4gJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9nZW9jb2RlL2pzb25cIixcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgYXBpX2tleTogXCJBSXphU3lCRXZERjd5aWdpNmRCMHRlM1NoeTI0UHNfZklBX0xQR1lcIixcclxuICAgICAgICAgICAgICAgIGFkZHJlc3M6IHNlbGYudmVudWVfYWRkcmVzc1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXNwb25zZSBmcm9tIGdvb2dsZSBoYXMgZG9jcy1zcGVjaWZpZWQgZm9ybWF0XHJcbiAgICAgICAgICAgICAgICBjb29yZHMgPSByZXNwb25zZS5yZXN1bHRzWzBdLmdlb21ldHJ5LmxvY2F0aW9uO1xyXG4gICAgICAgICAgICAgICAgc2VsZi50aGVfZ2VvbSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBvaW50XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IFtjb29yZHMubG5nLCBjb29yZHMubGF0XVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYWpheCBnZW9jb2RlIHN1Y2Nlc3NcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzZWxmLnRoZV9nZW9tLmNvb3JkaW5hdGVzKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHhocikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coeGhyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBhbGVydChcIllvdSBtdXN0IHByb3ZpZGUgYW4gYWRkcmVzc1wiKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGaXNoRnJ5Rm9ybSBDbGFzcyByZWFkRnJvbUZvcm0gbWV0aG9kOiByZWFkcyBmb3JtIGRhdGEgaW50byB0aGUgY2xhc3MuIEJhc2ljYWxseVxyXG4gKiB0aGUgc2FtZSBhcyBwdXNoVG9Gb3JtLCBidXQgaW5zdGVhZCBvZiB3cml0aW5nIHRvIGZvcm0sIHVzZXMgcHJvcGVydHkgbmFtZXNcclxuICogdG8gZ2V0IGZvcm0gdmFsdWVzLCB0aGVuIHdyaXRlcyB0aGVtIGJhY2sgdG8gdGhlIGNsYXNzLlxyXG4gKiBUaGlzIGNvdWxkIHBvdGVudGlhbGx5IGJlIHJ1biBieSBhbiBldmVudCBsaXN0ZW5lciBvbiBhbGwgdGhlIGZvcm0gZmllbGRzLFxyXG4gKiBzbyB0aGF0IHRoZSBjbGFzcyBpcyBhbHdheXMgdXBkYXRlZC5cclxuICovXHJcbkZpc2hGcnlGb3JtQ2xhc3MucHJvdG90eXBlLnJlYWRGcm9tRm9ybSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgdmFyIGJvb2xlYW5fbG9va3VwID0ge1xyXG4gICAgICAgIFllczogdHJ1ZSxcclxuICAgICAgICBObzogZmFsc2UsXHJcbiAgICAgICAgXCJVbnN1cmUgLyBOL0FcIjogbnVsbCxcclxuICAgICAgICBcIlwiOiBudWxsXHJcbiAgICB9O1xyXG4gICAgLyogcnVuIHRoZSBnZW9jb2RlciBpZiB0aGUgdXNlciBoYXNuJ3QuXHJcbiAgICAgIHZhciBnZW9jb2RlZDtcclxuICAgICAgaWYgKCFzZWxmLnRoZV9nZW9tKSB7XHJcbiAgICAgICAgZ2VvY29kZWQgPSBzZWxmLmdlb2NvZGUoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBnZW9jb2RlZCA9IHNlbGYudGhlX2dlb207XHJcbiAgICAgIH1cclxuICAgICAgKi9cclxuXHJcbiAgICAvLyQud2hlbihnZW9jb2RlZCkuZG9uZShmdW5jdGlvbigpIHtcclxuICAgIGZvciAodmFyIHAgaW4gc2VsZikge1xyXG4gICAgICAgIGlmIChzZWxmLmhhc093blByb3BlcnR5KHApKSB7XHJcbiAgICAgICAgICAgIC8qIHNraXAgc29tZSBwcm9wZXJ0aWVzIC0gc29tZSBkb24ndCBoYXZlIGNvcnJlc3BvbmRpbmcgZmllbGRzLCBzb21lIHdlXHJcbiAgICAgICAgICAgICAqIGRlYWwgd2l0aCBzZXBhcmF0ZWx5OlxyXG4gICAgICAgICAgICAgKiAtIGV2ZW50cyBhcmUgdXBkYXRlZCB0aHJvdWdoIHRoZSBkYXRlcmFuZ2VwaWNrZXIgZnVuY3Rpb25zXHJcbiAgICAgICAgICAgICAqIC0gdmFsaWRhdGVkIGFuZCBwdWJsaXNoZWQgYXJlIGhhbmRsZWQgaW4gYSBtb2RhbCBhcyBwYXJ0IG9mIGFcclxuICAgICAgICAgICAgICogY29uZmlybWF0aW9uIHdvcmtmbG93XHJcbiAgICAgICAgICAgICAqIC0gY2FydG9kYl9pZCBhbmQgdXVpZCBhcmVuJ3QgZW50ZXJlZCBieSB0aGUgdXNlclxyXG4gICAgICAgICAgICAgKiAtIGFzaF93ZWQgYW5kIGdvb2RfZnJpIGFyZSBib29sZWFucyBidXQgYXJlbid0IGJlaW5nIHVzZWQgcmlnaHQgbm93XHJcbiAgICAgICAgICAgICAqICh0aGV5IGNvdWxkIGJlIGF1dG9kZXRlY3RlZCBiYXNlZCBvbiB0aGUgZXZlbnQgZGF0ZXMpXHJcbiAgICAgICAgICAgICAqIFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgJC5pbkFycmF5KHAsIFtcclxuICAgICAgICAgICAgICAgICAgICBcInV1aWRcIixcclxuICAgICAgICAgICAgICAgICAgICBcImNhcnRvZGJfaWRcIixcclxuICAgICAgICAgICAgICAgICAgICBcImV2ZW50c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYXNoX3dlZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZ29vZF9mcmlcIixcclxuICAgICAgICAgICAgICAgICAgICBcInZhbGlkYXRlZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicHVibGlzaFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwidGhlX2dlb21cIlxyXG4gICAgICAgICAgICAgICAgXSkgPT0gLTFcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBoYW5kbGUgYm9vbGVhbiB2YWx1ZXMgd2l0aCBhIGxvb2t1cCB0byBnZXQgdGV4dCBmb3IgZHJvcGRvd25zXHJcbiAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgJC5pbkFycmF5KHAsIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhbGNvaG9sXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibHVuY2hcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJob21lbWFkZV9waWVyb2dpZXNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJoYW5kaWNhcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInRha2Vfb3V0XCJcclxuICAgICAgICAgICAgICAgICAgICBdKSAhPSAtMVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZltwXSA9IGJvb2xlYW5fbG9va3VwWyQoXCJzZWxlY3QjXCIgKyBwKS52YWwoKV07XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlIGlzIHRleHQuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGZbcF0gPSAkKFwiI1wiICsgcCkudmFsKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhzZWxmKTtcclxuICAgIC8vfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogRmlzaEZyeUZvcm0gQ2xhc3MgcmV0dXJuIGpzb24gbWV0aG9kOiByZXR1cm5zIGFsbCBkYXRhIHN0b3JlZCBpbiBjbGFzc1xyXG4gKi9cclxuRmlzaEZyeUZvcm1DbGFzcy5wcm90b3R5cGUucmV0dXJuSlNPTiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGZpc2hmcnlfanNvbiA9IHt9O1xyXG4gICAgZm9yICh2YXIgcCBpbiB0aGlzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkocCkpIHtcclxuICAgICAgICAgICAgZmlzaGZyeV9qc29uW3BdID0gdGhpc1twXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZpc2hmcnlfanNvbjtcclxufTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4vKipcclxuICogaW5zdGFudGlhdGUgRmlzaEZyeUZvcm0gQ2xhc3MsIHVzZWQgZm9yIGFsbCBpbnRlcmFjdGlvbiB3aXRoIHRoZSBmb3JtLlxyXG4gKi9cclxuXHJcbnZhciBGaXNoRnJ5Rm9ybSA9IG5ldyBGaXNoRnJ5Rm9ybUNsYXNzKCk7XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xyXG5cclxuLyoqXHJcbiAqIEluaXRpYXRlIERhdGUvVGltZSBQaWNrZXIgd2l0aCBkaXYgZWxlbWVudCBuYW1lPVwiZGF0ZXJhbmdlXCJcclxuICpcclxuICogVGhpcyB3b3JrcyBvbiBhbiBpbnN0YW5jZSBvZiBGaXNoRnJ5Rm9ybUNsYXNzOyBpdCBpcyBub3QgYSBtZXRob2QuXHJcbiAqL1xyXG4kKGZ1bmN0aW9uKCkge1xyXG4gICAgJCgnaW5wdXRbbmFtZT1cImRhdGVyYW5nZVwiXScpLmRhdGVyYW5nZXBpY2tlcih7XHJcbiAgICAgICAgYXV0b1VwZGF0ZUlucHV0OiBmYWxzZSxcclxuICAgICAgICB0aW1lUGlja2VyOiB0cnVlLFxyXG4gICAgICAgIHRpbWVQaWNrZXJJbmNyZW1lbnQ6IDE1LFxyXG4gICAgICAgIHRpbWVQaWNrZXIyNEhvdXI6IGZhbHNlLFxyXG4gICAgICAgIG9wZW5zOiBcImxlZnRcIixcclxuICAgICAgICBsb2NhbGU6IHtcclxuICAgICAgICAgICAgY2FuY2VsTGFiZWw6IFwiQ2xlYXJcIlxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgICQoJ2lucHV0W25hbWU9XCJkYXRlcmFuZ2VcIl0nKS5vbihcImFwcGx5LmRhdGVyYW5nZXBpY2tlclwiLCBmdW5jdGlvbihcclxuICAgICAgICBldixcclxuICAgICAgICBwaWNrZXJcclxuICAgICkge1xyXG4gICAgICAgICQodGhpcykudmFsKFxyXG4gICAgICAgICAgICBwaWNrZXIuc3RhcnREYXRlLmZvcm1hdChcIllZWVktTU0tREQgSEg6bW1cIikgK1xyXG4gICAgICAgICAgICBcIiAtIFwiICtcclxuICAgICAgICAgICAgcGlja2VyLmVuZERhdGUuZm9ybWF0KFwiWVlZWS1NTS1ERCBISDptbVwiKVxyXG4gICAgICAgICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkKCdpbnB1dFtuYW1lPVwiZGF0ZXJhbmdlXCJdJykub24oXCJjYW5jZWwuZGF0ZXJhbmdlcGlja2VyXCIsIGZ1bmN0aW9uKFxyXG4gICAgICAgIGV2LFxyXG4gICAgICAgIHBpY2tlclxyXG4gICAgKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJjYW5jZWwgZGF0ZXRpbWUgc2VsZWN0aW9uXCIpO1xyXG4gICAgICAgICQodGhpcykudmFsKFwiXCIpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgZGF0ZXRpbWUgdG8gbGlzdCBvbiBidXR0b24gY2xpY2sgdXNpbmcgZGF0ZXRpbWVwaWNrZXIgZm9ybSBkYXRhXHJcbiAgICAgKi9cclxuICAgICQoJ2lucHV0W25hbWU9XCJkYXRlcmFuZ2VcIl0nKS5vbihcImFwcGx5LmRhdGVyYW5nZXBpY2tlclwiLCBmdW5jdGlvbihcclxuICAgICAgICBldnQsXHJcbiAgICAgICAgcGlja2VyXHJcbiAgICApIHtcclxuICAgICAgICAvLyByZWFkIGluIHZhbHVlIGZyb20gdGhlIHBpY2tlciBhbmQgcHVzaCB0byB0aGUgRmlzaEZyeUZvcm0gY2xhc3MgaW5zdGFuY2UuXHJcbiAgICAgICAgLy92YXIgaWQgPSB1dWlkLnY0KCk7XHJcbiAgICAgICAgdmFyIGR0X3N0YXJ0ID0gbW9tZW50KFxyXG4gICAgICAgICAgICBwaWNrZXIuc3RhcnREYXRlLmZvcm1hdChcIllZWVktTU0tREQgSEg6bW1cIiksXHJcbiAgICAgICAgICAgIFwiWVlZWS1NTS1ERCBISDptbVwiXHJcbiAgICAgICAgKS5mb3JtYXQoKTtcclxuICAgICAgICB2YXIgZHRfZW5kID0gbW9tZW50KFxyXG4gICAgICAgICAgICBwaWNrZXIuZW5kRGF0ZS5mb3JtYXQoXCJZWVlZLU1NLUREIEhIOm1tXCIpLFxyXG4gICAgICAgICAgICBcIllZWVktTU0tREQgSEg6bW1cIlxyXG4gICAgICAgICkuZm9ybWF0KCk7XHJcbiAgICAgICAgdmFyIGR0X2lkID0gZHRfc3RhcnQgKyBcIi9cIiArIGR0X2VuZDtcclxuICAgICAgICBGaXNoRnJ5Rm9ybS5ldmVudHNbZHRfaWRdID0ge1xyXG4gICAgICAgICAgICBkdF9zdGFydDogZHRfc3RhcnQsXHJcbiAgICAgICAgICAgIGR0X2VuZDogZHRfZW5kXHJcbiAgICAgICAgfTtcclxuICAgICAgICAvL3VwZGF0ZSB0aGUgZGF0ZXRpbWUgbGlzdDsgY2xlYXIgaXQgb3V0IGZpcnN0XHJcbiAgICAgICAgJChcIiNldmVudHNcIikuZW1wdHkoKTtcclxuICAgICAgICAvLyBhc3NlbWJsZSBhIG5ldyBldmVudCBsaXN0IHVzaW5nIHRoZSBjbGFzcyBtZXRob2RcclxuICAgICAgICBGaXNoRnJ5Rm9ybS5wdXNoVG9Gb3JtRXZlbnRzKCk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vKipcclxuICogZ2VvY29kZSBvbiBnZW9jb2RlIGJ1dHRvbiBjbGljayB1c2luZyBlbnRlcmVkIGZvcm0gZGF0YVxyXG4gKi9cclxuJChmdW5jdGlvbigpIHtcclxuICAgICQoXCIjdmVudWVfYWRkcmVzc19nZW9jb2RlXCIpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy9yZWFkIGluIHZhbHVlIGZyb20gdmVudWVfYWRkcmVzcyBmb3JtIGZpZWxkIHRvIHRoZSBjbGFzc1xyXG4gICAgICAgIEZpc2hGcnlGb3JtLnZlbnVlX2FkZHJlc3MgPSAkKFwiI3ZlbnVlX2FkZHJlc3NcIikudmFsKCk7XHJcbiAgICAgICAgLy8gcnVuIHRoZSBnZW9jb2RlIG1ldGhvZFxyXG4gICAgICAgIHZhciBydW5HZW9jb2RlciA9IEZpc2hGcnlGb3JtLmdlb2NvZGUoKTtcclxuICAgICAgICAvLyB3aGVuIGl0J3MgY29tcGxldGUsIGdldCB0aGUgY29vcmRpbmF0ZXMgb3V0IG9mIGl0IGFuZCBhZGQgdG8gdGhlIHBhZ2UuXHJcbiAgICAgICAgJC53aGVuKHJ1bkdlb2NvZGVyKS5kb25lKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgeHkgPVxyXG4gICAgICAgICAgICAgICAgRmlzaEZyeUZvcm0udGhlX2dlb20uY29vcmRpbmF0ZXNbMF0gK1xyXG4gICAgICAgICAgICAgICAgXCIsIFwiICtcclxuICAgICAgICAgICAgICAgIEZpc2hGcnlGb3JtLnRoZV9nZW9tLmNvb3JkaW5hdGVzWzFdO1xyXG4gICAgICAgICAgICAvLyBBREQgUkVTVUxUIFRPIFBBR0UgRUxFTUVOVFxyXG4gICAgICAgICAgICAkKFwiI3ZlbnVlX2FkZHJlc3NfZ2VvY29kZWRcIikuZW1wdHkoKTtcclxuICAgICAgICAgICAgJChcIiN2ZW51ZV9hZGRyZXNzX2dlb2NvZGVkXCIpLmFwcGVuZCh4eSk7XHJcbiAgICAgICAgICAgIHZhciBjZW50ZXIgPSBMLmxhdExuZyhcclxuICAgICAgICAgICAgICAgIEZpc2hGcnlGb3JtLnRoZV9nZW9tLmNvb3JkaW5hdGVzWzFdLFxyXG4gICAgICAgICAgICAgICAgRmlzaEZyeUZvcm0udGhlX2dlb20uY29vcmRpbmF0ZXNbMF1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgbWFwLnNldFZpZXcoY2VudGVyLCAxNSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vKipcclxuICogb24gY29uZmlybSBidXR0b24gY2xpY2ssIHRoZSBtb2RhbCB3aWxsIG9wZW4uIEl0IGFsc28gZmlyZXMgdGhlIG1ldGhvZFxyXG4gKiB0byByZWFkIGFsbCB0aGUgZGF0YSBmcm9tIHRoZSBmb3JtLlxyXG4gKi9cclxuJChmdW5jdGlvbigpIHtcclxuICAgICQoXCIjY29uZmlybWJ1dHRvblwiKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIEZpc2hGcnlGb3JtLnJlYWRGcm9tRm9ybSgpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIG9uIGNoZWNraW5nIG9mIHB1Ymxpc2ggYm94LCBzaG93IHRoZSBwdWJsaXNoIGNvbmZpcm1hdGlvblxyXG4gKlxyXG4kKCcjcHVibGlzaFRoaXMgaW5wdXQ6Y2hlY2tib3gnKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAoJCh0aGlzKS5hdHRyKFwiY2hlY2tlZFwiKSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcImNoZWNrZWRcIik7XHJcbiAgICAgICQoJyNwdWJsaXNoQ29uZmlybWF0aW9uJykuc2hvdygpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coXCJ1bmNoZWNrZWRcIik7XHJcbiAgICAgICQoJyNwdWJsaXNoQ29uZmlybWF0aW9uJykuaGlkZSgpO1xyXG4gICAgfVxyXG59KTtcclxuKi9cclxuLyoqXHJcbiAqIGRpc2FibGUgcHVibGlzaCBjaGVja2JveCB1bmxlc3MgdmFsaWRhdGUgaXMgY2hlY2tlZFxyXG4gKlxyXG4kKCcjcHVibGlzaFRoaXMgaW5wdXQ6Y2hlY2tib3gnKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAoJCh0aGlzKS5pcyhcIjpjaGVja2VkXCIpKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiY2hlY2tlZFwiKTtcclxuICAgICAgJCgnI3B1Ymxpc2hUaGlzJykucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZyhcInVuY2hlY2tlZFwiKTtcclxuICAgICAgJCgnI3B1Ymxpc2hUaGlzJykucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcclxuICAgIH1cclxufSk7XHJcbiovXHJcblxyXG4vKipcclxuICogaW5pdGF0ZSBmb3JtIHN1Ym1pc3Npb24uIGNhbGxzIGludGVybmFsIEZsYXNrIHJvdXRlLCB3aGljaCBoYW5kbGVzXHJcbiAqIHN1Ym1pc3Npb24gb2YgZm9ybSBkYXRhIHRvIGRhdGFiYXNlLlxyXG4gKi9cclxuJChmdW5jdGlvbigpIHtcclxuICAgICQoXCIjc3VibWl0YnV0dG9uXCIpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gcmVhZCB0aGUgZm9ybSBhbmQgZ2V0IHRoZSBqc29uXHJcbiAgICAgICAgdmFyIGZpc2hmcnlfanNvbiA9IEZpc2hGcnlGb3JtLnJldHVybkpTT04oKTtcclxuXHJcbiAgICAgICAgLy8gTGFzdC1taW51dGUgcHJvcGVydHkgdXBkYXRlcy4uLlxyXG4gICAgICAgIC8vIGNoZWNrIGlmIHZhbGlkYXRpb24gY2hlY2tib3ggb24gY29uZmlybWF0aW9uIG1vZGFsIGlzIHRydWVcclxuICAgICAgICBpZiAoJChcIiN2YWxpZGF0ZWRcIikucHJvcChcImNoZWNrZWRcIikpIHtcclxuICAgICAgICAgICAgZmlzaGZyeV9qc29uLnZhbGlkYXRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHRoZW4gYWxzbyBjaGVjayBpZiBib3RoIHB1Ymxpc2ggY29uZmlybWF0aW9ucyBoYXZlIGJlZW4gY2hlY2tlZC5cclxuICAgICAgICAvL2lmICgoJCgnI3B1Ymxpc2hUaGlzJykucHJvcCgnY2hlY2tlZCcpKSAmICgkKCcjcHVibGlzaFRoaXNZZXNSZWFsbHknKS5wcm9wKCdjaGVja2VkJykpKSB7XHJcbiAgICAgICAgaWYgKCQoXCIjcHVibGlzaFwiKS5wcm9wKFwiY2hlY2tlZFwiKSkge1xyXG4gICAgICAgICAgICBmaXNoZnJ5X2pzb24ucHVibGlzaCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiLS0tXCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiU3VibWl0dGVkIEZpc2ggRnJ5OlwiKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhmaXNoZnJ5X2pzb24pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGZpc2hmcnlfanNvbikpO1xyXG5cclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PVVURi04XCIsXHJcbiAgICAgICAgICAgIC8vIHVybDogJFNDUklQVF9ST09UICsgXCIvY29udHJpYnV0ZS9maXNoZnJ5L3N1Ym1pdFwiLFxyXG4gICAgICAgICAgICB1cmw6IEZsYXNrLnVybF9mb3IoJ3N1Ym1pdF9maXNoZnJ5JyksXHJcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KGZpc2hmcnlfanNvbiksXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN1Y2Nlc3NcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgciA9IEpTT04ucGFyc2UocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocik7XHJcbiAgICAgICAgICAgICAgICAkKFwiI215TW9kYWxcIikubW9kYWwoXCJoaWRlXCIpO1xyXG4gICAgICAgICAgICAgICAgJChcIiNhbGVydC1zdWNjZXNzXCIpLnNob3coKTtcclxuICAgICAgICAgICAgICAgIC8vIGEgcmVkaXJlY3QgcGFyYW0gd2lsbCBiZSBwcm92aWRlZCBpZiB0aGUgZmlzaCBmcnkgd2FzIG5ld1xyXG4gICAgICAgICAgICAgICAgaWYgKHIucmVkaXJlY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAvKiB0aGUgcmVkaXJlY3QgbG9hZHMgdGhlIG5ld2x5IHN1Ym1pdHRlZCBGaXNoIEZyeSBpbnRvIHRoZSBlZGl0aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICogdmVyc2lvbiBvZiB0aGUgZm9ybSB2aWEgJy9jb250cmlidXRlL2Zpc2hmcnkvPGludDpmZl9pZD4nXHJcbiAgICAgICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoJEZsYXNrLnVybF9mb3IoJ2hvbWUnKSArIHIucmVkaXJlY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAkKFwiI215TW9kYWxcIikubW9kYWwoXCJoaWRlXCIpO1xyXG4gICAgICAgICAgICAgICAgJChcIiNhbGVydC13YXJuaW5nXCIpLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIE5vdGUgdGhhdCBkZWxldGlvbiB2aWEgdGhlIGZvcm0gaXMgaGFuZGxlZCB0aHJvdWdoIGEgUE9TVCByZXF1ZXN0LCB2aWEgYVxyXG4gKiBmb3JtIGZpZWxkIGFuZCBGbGFzayAtIG5vdCBpbiB0aGlzIHNjcmlwdFxyXG4gKi8iXX0=
