var xhr;
new autoComplete({
    selector: "#venue_address",
    source: function(term, response) {
        try {
            xhr.abort();
        } catch (e) {}
        xhr = $.getJSON(
            "https://api.mapbox.com/geocoding/v5/mapbox.places/" + term + ".json?", {
                access_token: "pk.eyJ1IjoiY2l2aWNtYXBwZXIiLCJhIjoiY2pkOXV4cnk4MTVpMDJ3bzlneTFydDZlbCJ9.wrwB1uO53s_FhpVJv-Zf-Q"
            },
            function(data) {
                response(data);
                return $.map(data.features, function(feature) {
                    return {
                        name: feature.place_name,
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0],
                        source: "Mapbox"
                    };
                });
            }
        );
    }
});