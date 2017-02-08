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
     * Event Dates/Times object (dictionary): temporary structure for storing
     * event dates and times with a UUID, to facilitate adding/removing.
     * The "event_uuid_string" placeholder is not persisted outside of the
     * current class instance.
     * @example
     * {
     *   "event_uuid_string": {
     *      "start": "2017-03-21T15:00:00Z",
     *      "stop": "2017-03-21T19:00:00Z",
     *   },
     *   "event_uuid_string": {
     *      ...
         },
     *   ...
     * }
     */
    this.event_dt = {};
    
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
 * FishFryForm Class readForm method: reads form data into the class. Used by
 * submitNew method
 */ 
FishFryFormClass.prototype.readForm = function() {
};

/**
 * FishFryForm Class loadExisting method: reads in a record to the class
 */ 
FishFryFormClass.prototype.loadExisting = function() {
    /*
    $.ajax({
        url: "https://christianbgass.carto.com/api/v2/sql?q=SELECT cdb_geocode_street_point('" + this.venue_address + "')&api_key=this.carto"
    }).done(function(data) {
        console.log(data);
    });
    */
};

/**
 * FishFryForm Class overwriteExisting method: submits all data stored in class
 * to CARTO
 */ 
FishFryFormClass.prototype.overwriteExisting = function() {
    /* will need to write to the primary table first, get the carto_id, and then
     * use that for the venue key to write to the datetime table
     * 
     */
    
    /* uses an INSERT ... ON DUPLICATE KEY query to overwrite the existing record.
     * INSERT INTO table (id, name, age) VALUES(1, "A", 19) ON DUPLICATE KEY UPDATE name="A", age=19
     * 
    $.ajax({
        url: "https://christianbgass.carto.com/api/v2/sql?q=SELECT cdb_geocode_street_point('" + this.venue_address + "')&api_key=this.carto"
    }).done(function(data) {
        console.log(data);
    });
    */
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
 * FishFryForm Class addDate method - write dates to the venue_dt table.
 * Called by overwriteExisting and submitNew methods
 */ 
FishFryFormClass.prototype.addDate = function() {
};

/**
 * FishFryForm Class removeDate method - remove dates from the venue_dt table
 * Called by overwriteExisting and submitNew methods
 */ 
FishFryFormClass.prototype.removeDate = function(uuid) {
    delete this.event_dt[uuid];
};

/**
 * FishFryForm Class return json method: returns all data stored in class in
 * json format
 */ 
FishFryFormClass.prototype.returnJSON = function() {
    return JSON.stringify(this);
};

/**
 * FishFryForm Class submitUpdate method: submits all data stored in class to
 * CARTO
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
            url: "https://search.mapzen.com/v1/search",
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
$('input[name="daterange"]').on('apply.daterangepicker', function(evt, picker) {
    // read in value from the picker and push to the class.
    id = uuid.v4();
    FishFryForm.event_dt[id] = {
        "dt_start": picker.startDate.format('YYYY-MM-DD HH:mm'),
        "dt_end": picker.endDate.format('YYYY-MM-DD HH:mm')
        };
    //update the datetime list; clear it out first
    $("#venue_dt").empty();
    //assemble a new one and 
    $.each(FishFryForm.event_dt, function(k,v){
        
        // write UUID as element ID field; used to manage updates.
        var event_dt_li = '<li class="list-group-item" id="' + k + '"><div class="form-group"><div class="input-group">';
        // add start and end time to the list
        event_dt_li += '<input disabled="disabled" type="text" class="form-control" value="'+ v.dt_start +' - ' + v.dt_end +'">';
        event_dt_li += '<span class="input-group-btn"><button name="remove_dt" id="' + k + '"class="btn btn-danger" type="button"><span class="glyphicon glyphicon-remove" aria-hidden="true"></button></span>';
        event_dt_li += '</div></div></li>';
        
        // ADD RESULT TO PAGE ELEMENT
        $("#venue_dt").append(event_dt_li);
        
        // bind a remove function (rm datetime from list on "X" button click)
        $('button[name="remove_dt"]').bind('click', function() {
            // remove the UI item
            $(this).closest(".list-group-item").remove();
            // remove the class item
            delete FishFryForm.event_dt[k];
            
        });
        
    });
});

