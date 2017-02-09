/**
 * create the dataTable from the CartoDB SQL API response
 */
$(document).ready(function() {
    var response = $('#data-table').DataTable({
        ajax:  {
            url: "https://christianbgass.carto.com/api/v2/sql?q=SELECT venue_name, venue_address, website, phone, email, validated, publish, cartodb_id FROM fishfrymap",
            type: 'GET',
            dataSrc: 'rows'
        },
        /*
        "columnDefs": [{
            "defaultContent": "-",
            "targets": "_all"
        }]
        */
        //"order": [[0, "asc"]],
        columns : [
            {"rows": 'venue_name'},
            {"rows": 'venue_address'},
            {"rows": 'website'},
            {"rows": 'phone'},
            {"rows": 'email'},
            {"rows": 'validated'},
            {"rows": 'publish'},
            {"rows": 'cartodb_id'}
            /*
            {rows: 'alcohol'},
            {rows: 'ash_wed'},
            {rows: 'etc'},
            {rows: 'good_fri'},
            {rows: 'handicap'},
            {rows: 'homemade_pierogies'},
            {rows: 'lunch'},
            {rows: 'men{data: '},
            {rows: 'publish'},
            {rows: 'take_out'},
            {rows: 'the_geom'},
            {rows: 'the_geom_webmercator'},
            {rows: 'venue_notes'},
            {rows: 'venue_type'},
            {rows: 'z_desc_2016'}
            */
        ]
    });
    //console.log(response);
});