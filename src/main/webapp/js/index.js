$(document).ready(function () {
    $("#section_sidebar").load(APP_URL+"/components/menu.html");
    $("#section_footer").load(APP_URL+"/components/footer.html");

    $('.nav-link').each(function() {

        if($(this).data('roles')) {
            let navelement = $(this);
            navelement.hide();
            $.each( $(this).data('roles').split(','),
                function( index, value ) {
                    if (userLogged.Profiles.filter(itm => itm === value).length > 0) {
                        navelement.show();
                    }
                });
        }

        if ($(this).attr('href') === window.location.hash) {
            this.className = "nav-link active";
        } else {
            this.className = "nav-link";
        }
    });

    $(".nav-link").click(function () {
        urlHash = $(this).attr('href');
        rol = urlHash.substring(1);

        $('.nav-link').each(function() {
            if ($(this).attr('href') === urlHash) {
                this.className = "nav-link active";
            } else {
                this.className = "nav-link";
            }
        });
        $('#tableitems').bootstrapTable('refresh');
    });

    $body = $("body");

    loadDropDown($("#select-status"), "utils/listStatusUniverse", "name", "name");
    loadDropDown($("#select-country"), "utils/pending_task_sel/Country?UBT_Id=" + userLogged.UBT_Id  , "value", "value");

    $("#filters-global").hide();

    if (userLogged.Profiles.filter(itm => itm === 'BUM' || itm === 'PRMAN' || itm === 'INMAN').length > 0) {
        loadDropDown($("#select-process"),
            "utils/pending_task_sel/PPCH_ShortDesc?id=PPCH_Id&UBT_Id=" + userLogged.UBT_Id  , "id", "value");
        loadDropDown($("#select-user"), "utils/pending_task_sel/taskUser?UBT_Id=" + userLogged.UBT_Id  , "value", "value", null, false, true);
        loadDropDown($("#select-bu"), "utils/pending_task_sel/BU?UBT_Id=" + userLogged.UBT_Id  , "value", "value");

        $("#filters-global").show();
    }
    $('#tableitems').bootstrapTable(
        {
            columns: [
                {
                    field: 'delayed',
                    title: 'Link to task',
                    sortable: true,
                    align: 'center',
                    formatter: operateUrl,
                    width: '5%',
                    widthUnit: '%'
                },
                {
                    field: 'PPCH_Id',
                    title: 'PPC ID',
                    sortable: true,
                    align: 'center',
                    width: '5%',
                    widthUnit: '%'
                },
                {
                    field: 'PPCH_ShortDesc',
                    title: 'Short desc',
                    sortable: true,
                    halign: 'center',
                    align: 'left',
                    width: '10%',
                    widthUnit: '%'
                },
                {
                    field: 'taskName',
                    title: 'Task name',
                    sortable: true,
                    halign: 'center',
                    align: 'left',
                    width: '20%',
                    widthUnit: '%'
                },
                {
                    field: 'taskUser',
                    title: 'Task user',
                    sortable: true,
                    halign: 'center',
                    align: 'left',
                    formatter: operateTaskUser,
                    width: '10%',
                    widthUnit: '%'
                },
                {
                    field: 'rol',
                    title: 'Rol',
                    sortable: true,
                    halign: 'center',
                    align: 'left',
                    width: '5%',
                    widthUnit: '%'
                },
                {
                    field: 'startDate',
                    title: 'Start date',
                    sortable: true,
                    align: 'center',
                    formatter: operateStartDate,
                    width: '5%',
                    widthUnit: '%'
                },
                {
                    field: 'endDate',
                    title: 'End date',
                    sortable: true,
                    align: 'center',
                    formatter: operateEndDate,
                    width: '5%',
                    widthUnit: '%'
                },
                {
                    field: 'BU',
                    title: 'BU',
                    sortable: true,
                    halign: 'center',
                    align: 'left',
                    width: '10%',
                    widthUnit: '%'
                },
                {
                    field: 'Country',
                    title: 'Country',
                    sortable: true,
                    halign: 'center',
                    align: 'left',
                    width: '5%',
                    widthUnit: '%'
                },
                {
                    field: 'PPCS_Desc',
                    title: 'status',
                    sortable: true,
                    halign: 'center',
                    align: 'left',
                    width: '10%',
                    widthUnit: '%'
                }
            ],
            sortPriority: [
                [
                    {"sortName": "PPCS_Desc","sortOrder":"desc"},
                    {"sortName":"startDate","sortOrder":"desc"}
                ]
            ]
        }
    );
});
function operateStartDate(value, row, index) {
    return [
        '<small>' + (row.startDate ? formatDate(row.startDate, '/') : '--/--/----')+ '</small>'
    ].join('')
}
function operateEndDate(value, row, index) {
    return [
        '<small>' + (row.endDate ? formatDate(row.endDate, '/') : '--/--/----')+ '</small>'
    ].join('')
}

function operateTaskUser(value, row, index) {
    var tu = row.taskUser ? row.taskUser.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, function(letter) {
        return letter.toUpperCase();
    }) : '';
    return [
        '<small>' + tu + '</small>'
    ].join('')
}

function operateUrl(value, row, index) {
    return [
        '<a data-toggle="tooltip" data-placement="top" ' +
        'style="witdh: 100%" class="btn btn-'+(row.delayed?.toUpperCase() === 'IN TIME' ? 'success' : 'danger')+'" ' +
        'href="javascript:editarHeader(' + row.PPCH_Id + ',\'' + row.PPCS_Desc + '\', \''+row.url+'\')" title="Edit">',
        row.delayed,
        '</a>  '
    ].join('')
}
function ajaxRequest(params) {

    // 🔧 Fuente correcta del rol en la versión actual
    let effectiveRol = localStorage.getItem('activeRol');

    // Compatibilidad defensiva por si alguien setea "rol"
    if (typeof rol !== 'undefined' && rol && rol !== 'all') {
        effectiveRol = rol;
    }

    let rolParam = (effectiveRol ? "&rol=" + effectiveRol : '');

    var status = ($("#select-status").val() != null && $("#select-status").val() !== ''
        ? "&status=" + $("#select-status").val()
        : '');

    var country = ($("#select-country").val() != null && $("#select-country").val() !== ''
        ? "&country=" + $("#select-country").val()
        : '');

    var delayed = '';
    var process = '';
    var user = '';
    var bu = '';

    if (userLogged.Profiles.filter(itm => itm === 'BUM' || itm === 'PRMAN' || itm === 'INMAN').length > 0) {
        delayed = ($("#select-delayed").val() != null && $("#select-delayed").val() !== ''
            ? "&delayed=" + $("#select-delayed").val()
            : '');
        process = ($("#select-process").val() != null && $("#select-process").val() !== ''
            ? "&process=" + $("#select-process").val()
            : '');
        user = ($("#select-user").val() != null && $("#select-user").val() !== ''
            ? "&user=" + $("#select-user").val()
            : '');
        bu = ($("#select-bu").val() != null && $("#select-bu").val() !== ''
            ? "&bu=" + $("#select-bu").val()
            : '');
    }

    $.get({
        url: URLBACKEND + "/utils/pending_tasks?UBT_Id=" + userLogged.UBT_Id
            + rolParam
            + status
            + country
            + delayed
            + process
            + user
            + bu
            + "&" + $.param(params.data),
        type: 'GET'
    })
    .then(tableData => {
        params.success(tableData);
    })
    .catch(() => {
        params.error();
    });
}


function filtrar(evt) {
    if (evt)
        evt.preventDefault();

    var $table = $('#tableitems').bootstrapTable();
    $table.bootstrapTable('refresh');
}

function limpiar(evt) {

    $("#select-status").val("");
    $("#select-country").val("");
    $("#select-delayed").val("");
    $("#select-process").val("");
    $("#select-user").val("");
    $("#select-bu").val("");

    filtrar(evt);
}