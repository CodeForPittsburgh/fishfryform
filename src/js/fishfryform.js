// imports
// var $ = jQuery;
var Vue = require('vue');
var uuidV4 = require('uuid/v4');
// var L = require('leaflet');
// var models = require('./models');
var season = 2018;

var feature = {
    season: 2018,
    geometry: {
        coordinates: [],
        type: "Point"
    },
    ffid: "",
    properties: {
        website: "",
        cartodb_id: null,
        take_out: null,
        venue_name: "",
        lunch: true,
        venue_address: "",
        publish: false,
        venue_notes: "",
        handicap: null,
        alcohol: false,
        events: {},
        homemade_pierogies: null,
        phone: "",
        etc: "",
        validated: false,
        email: "",
        menu: {
            url: "",
            text: ""
        },
        venue_type: ""
    }
}

// Vue.component('hello-world', {

Vue.component('hello-world', {
    template: '#fish-fry-form-template',
    props: ['feature']
});

var vm = new Vue({
    el: '#FishFryForm',
    delimiters: ["*[[", "]]*"],
    data: function() { return feature; },
    mounted: function() {
        this.$nextTick(function() {
            console.log("mounted");
            console.log(this.$el); // === document.getElementById('FishFryForm'));
        })
    },
    created: function() {
        console.log(this.$data === feature);
    }
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