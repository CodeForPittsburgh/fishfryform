/*
(function() {
    
}).call(this);
*/

/******************************************************************************/

/**
 * FishFryFormClass - class for every venue on the Fish Fry Form. Inherits from
 * ServiceKeys class
 * @class
 */
function FishFryFormClass () {
    /**
     * CARTO fish fry venues table id
     * @type number
     */
    this.cartodb_id = 0;
    
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
     * Event Dates/Times
     * @example
     *  [
     *    {
     *      "event_id": 1,
     *      "start": "2017-03-21T15:00:00Z",
     *      "stop": "2017-03-21T19:00:00Z",
     *    }, {
     *      ...
     *    }
     *  ]
     */
    this.event_dt = [];
    
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
    this.etc_notes = "";

    /**
     * ash wed flag - auto populated
     * @type boolan
     */
    this.ash_wed = null;
    /**
     * good friday flag - auto populated
     * @type boolan
     */
    this.good_fri = null;

    /**
     * last year's data (for reference)
     * @type string
     */
    this.z_desc_2016 = "";

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
 * FishFryForm Class addDate method
 */ 
FishFryFormClass.prototype.addDate = function() {
};

/**
 * FishFryForm Class removeDate method
 */ 
FishFryFormClass.prototype.removeDate = function() {
};

/**
 * FishFryForm Class return json method: returns all data stored in class in
 * json format
 */ 
FishFryFormClass.prototype.returnJSON = function() {
};

/**
 * FishFryForm Class submitNew method: submits all data stored in class to CARTO
 */ 
FishFryFormClass.prototype.submitNew = function() {
    /* will need to write to the primary table first, get the carto_id, and then
     * use that for the venue key to write to the datetime table
     */
    
    /*
    $.ajax({
        url: "https://christianbgass.carto.com/api/v2/sql?q=SELECT cdb_geocode_street_point('" + this.venue_address + "')&api_key=this.carto"
    }).done(function(data) {
        console.log(data);
    });
    */
    
};

/**
 * FishFryForm Class submitUpdate method: submits all data stored in class to CARTO
 */ 
FishFryFormClass.prototype.submitUpdate = function() {
};

/**
 * geocode function
 * submit to geocoder and provide feedback to user for errors
 */ 
FishFryFormClass.prototype.geocode = function() {
    //assign this class instance to self
    var self = this;
    // if value is something:
    if (self.venue_address !== null) {
        // submit value to geocoder service
        return $.ajax({
            url: "https://search.mapzen.com/v1/search", //?api_key=search-AxvxH8H",
            data: {
                "api_key": "search-AxvxH8H",
                "text": self.venue_address,
                "focus.point.lat": 40.4417157,
                "focus.point.lon": -80.0111941
            },
            cache: false,
            type: "GET",
            success: function(response) {
                self.the_geom = response;
                console.log("ajax geocode success");
                console.log(self.the_geom);
            },
            error: function(xhr) {
                console.log(xhr);
            }
        });

    } else {
        alert("You must provide an address");
    }
};

/******************************************************************************/

/**
 * instantiate FishFryForm Class, used for all interaction with the form.
 */

FishFryForm = new FishFryFormClass();

/******************************************************************************/

/**
 * geocode on geocode button click using entered form data
 */
$('#venue_address_geocode').on('click', function () {
    //read in value from venue_address form field to the class
    FishFryForm.venue_address = $("#venue_address").val();
    // run the geocode method
    var runGeocoder = FishFryForm.geocode();
    $.when(runGeocoder).done(function() {
        var f = FishFryForm.the_geom.features[0];
        // var label = f.properties.label;
        var yx = f.geometry.coordinates;
        // ADD RESULT TO PAGE ELEMENT
        $("#venue_address_geocoded").append(JSON.stringify(yx));
    });
});

/**
 * add datetime to list on button click using datetimepicker form data
 */
$('input[name="daterange"]').on('apply.daterangepicker', function(ev, picker) {
    //read in value from the picker and push to the class
    FishFryForm.event_dt.push({
        "dt_start": picker.startDate.format('YYYY-MM-DD HH:mm'),
        "dt_end": picker.endDate.format('YYYY-MM-DD HH:mm')
    });
    console.log(FishFryForm.event_dt);
    //update the datetime list; clear it out first
    $("#venue_dt").empty();
    //assemble a new one
    $.each(FishFryForm.event_dt, function(k,v){
        console.log(v.dt_start + ' - ' + v.dt_end);
        var event_dt_li = "";
        event_dt_li += '<li class="list-group-item" id="event_dt"><div class="form-group"><div class="input-group">';
        event_dt_li += '<input disabled="disabled" type="text" class="form-control" value="'+ v.dt_start +' - ' + v.dt_end +'">';
        event_dt_li += '<span class="input-group-btn"><button class="btn btn-danger" type="button"><span class="glyphicon glyphicon-remove" aria-hidden="true"></button></span>';
        event_dt_li += '</div></div></li>';
        $("#venue_dt").append(event_dt_li);
    // ADD RESULT TO PAGE ELEMENT
    /*
        
    */
    });
});
