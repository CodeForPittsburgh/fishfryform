function FishFryEvent(start, end) {
    var idx = start + "/" + end;
    return {
        idx: {
            dt_start: start,
            dt_end: end
        }
    };
}

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