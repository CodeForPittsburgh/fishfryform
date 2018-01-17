function FishFryEvent(start, end) {
    var idx = start + "/" + end;
    return {
        idx: {
            "dt_start": start,
            "dt_end": end,
        }
    };
}

function FishFry() {
    var properties = {
        "venue_name": "",
        "venue_type": "",
        "venue_address": "",
        "phone": "",
        "website": "",
        "email": "",
        "venue_notes": "",
        "take_out": null,
        "lunch": null,
        "alcohol": null,
        "handicap": null,
        "homemade_pierogies": null,
        "menu": {
            "url": "",
            "text": ""
        },
        "events": {},
        "etc": "",
        "publish": false,
        "validated": false
    };
    var season = 2018;
    var geometry = {};
    var cartodb_id = null;

    return {
        properties,
        geometry,
        season,
        cartodb_id
    };
}