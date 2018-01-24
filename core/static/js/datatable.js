/**
 * create the dataTable from the CartoDB SQL API response
 */
$(document).ready(function() {
    var table = $("#data-table").DataTable({
        processing: true,
        dom: "lfrtip",
        ajax: {
            url: '',
            // url: Flask.url_for(),
            type: "GET",
            dataSrc: "features"
        },
        deferRender: true,
        columns: [
            { data: "properties.venue_name" },
            { data: "properties.venue_address" },
            { data: "properties.validated" },
            { data: "properties.publish" },
            { data: "properties.cartodb_id" }
        ],
        select: {
            style: "single",
            blurable: true
        },
        buttons: [{
            extend: "selected",
            text: "Edit Selected Fish Fry"
                /*
                action: function (e, dt, button, config) {
                    //alert( dt.rows( { selected: true } ).indexes().length +' row(s) selected' );
                    var x = dt.rows({ selected: true }).data();
                    console.log(JSON.stringify(x[0].cartodb_id));
                }
                */
        }]
    });

    $("#data-table").on("click", "tr", function() {
        if ($(this).hasClass("selected")) {
            var row = table.row(".selected").data();
            //console.log(row.cartodb_id);
            // dynamically set the route for the edit button from selected row
            route = "/contribute/fishfry/" + row.cartodb_id;
            $("#editbutton").attr("disabled", false);
            $("#editbutton").attr("href", route);
            $("#editbutton").text("Edit Selected Fish Fry (" + row.cartodb_id + ")");
        } else {
            $("#editbutton").attr("disabled", true);
        }
        /*
        if ( $(this).hasClass('selected') ) {
            $(this).removeClass('selected');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
        */
    });

    $("#editbutton").click(function() {
        var row = table.row(".selected").data();
        console.log(row.cartodb_id);
    });

    var tableCompleted = $("#data-table-completed").DataTable({
        processing: true,
        dom: "lfrtip",
        ajax: {
            url: "https://christianbgass.carto.com/api/v2/sql?q=SELECT venue_name, venue_address, validated, publish, cartodb_id FROM fishfrymap WHERE validated = true OR publish = true",
            type: "GET",
            dataSrc: "rows"
        },
        deferRender: true,
        columns: [
            { data: "venue_name" },
            { data: "venue_address" },
            { data: "validated" },
            { data: "publish" },
            { data: "cartodb_id" }
        ],
        select: {
            style: "single",
            blurable: true
        },
        buttons: [{
            extend: "selected",
            text: "Edit Selected Fish Fry"
                /*
                action: function (e, dt, button, config) {
                    //alert( dt.rows( { selected: true } ).indexes().length +' row(s) selected' );
                    var x = dt.rows({ selected: true }).data();
                    console.log(JSON.stringify(x[0].cartodb_id));
                }
                */
        }]
    });

    $("#data-table-completed").on("click", "tr", function() {
        if ($(this).hasClass("selected")) {
            var row = tableCompleted.row(".selected").data();
            //console.log(row.cartodb_id);
            route = "/contribute/fishfry/" + row.cartodb_id;
            $("#editbutton-completed").attr("disabled", false);
            $("#editbutton-completed").attr("href", route);
            $("#editbutton-completed").text(
                "Edit Selected Fish Fry (" + row.cartodb_id + ")"
            );
        } else {
            $("#editbutton-completed").attr("disabled", true);
        }
        /*
        if ( $(this).hasClass('selected') ) {
            $(this).removeClass('selected');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
        */
    });

    $("#editbutton-completed").click(function() {
        var row = tableCompleted.row(".selected").data();
        console.log(row.cartodb_id);
    });
});