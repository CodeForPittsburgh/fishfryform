/**
 * create the dataTable from the CartoDB SQL API response
 */
$(document).ready(function() {
    var table = $('#data-table').DataTable({
        processing: true,
        dom: 'lfrtipB',
        ajax:  {
            url: "https://christianbgass.carto.com/api/v2/sql?q=SELECT venue_name, venue_address, website, phone, email, validated, publish, cartodb_id FROM fishfrymap",
            type: 'GET',
            dataSrc: 'rows'
        },
        columns : [
            {data: 'venue_name'},
            {data: 'venue_address'},
            {data: 'website'},
            {data: 'phone'},
            {data: 'email'},
            {data: 'validated'},
            {data: 'publish'},
            {data: 'cartodb_id'}
        ],
        select: {
            style: 'single'
        },
        buttons: [
             {
                 extend: 'selected',
                 text: 'Edit selected Fish Fry',
                 action: function (e, dt, button, config) {
                     alert( dt.rows( { selected: true } ).indexes().length +' row(s) selected' );
                 }
             }
         ]
    });
});

