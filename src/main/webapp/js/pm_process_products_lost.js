let itemsSeleccionadosTableSelected;
function ajaxRequestProductsList(params) {
    var principal = $("#select-principal").val();
    var company = $("#select-company").val();
    var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
    var buAgrupada = userLogged.bu_agrupada;
    var reportingLine = $('#select-principalRepLine').val();
    if (principal == null) principal = "";
    if (company == null) company = "";
    if (UbT_LocalADUuser == null) UbT_LocalADUuser = "";
    if (buAgrupada == null) buAgrupada = "";
    if (reportingLine == null) reportingLine = "";

    itemsSeleccionados = new Array();

    let urlPost = URLBACKEND + "pmProcess/consultPrincipalReportingLineProducts?COU_ID=" + company
        + "&BU_AGRUPADA=" + userLogged.bu_agrupada
        + "&UBT_LocalADUuser=" + UbT_LocalADUuser
        + "&PRINCIPAL_ERP_NUMBER=" + principal
        + "&REPORTING_LINE=" + encodeURIComponent(reportingLine)
        + "&LOST=FALSE"
        + "&ROL=" + ((esBUM) ? "BUM" : "PM")
        + "&" + $.param(params.data);
    $.get({
        url: urlPost,
        type: 'Get'//,
        //timeout: 1000
    }).then(tableData => {
        params.success(tableData)
    }).catch(e => {
        params.error();
        //$table.bootstrapTable('removeAll');
    });
}

function ajaxRequestProductsListLost(params) {
    var principal = $("#select-principal").val();
    var company = $("#select-company").val();
    var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
    var buAgrupada = userLogged.bu_agrupada;
    var reportingLine = $('#select-principalRepLine').val();
    var permisosABuscar = ['BUM'];
    var esBUM = userLogged.Profiles.some(i => permisosABuscar.includes(i));
    if (principal == null) principal = "";
    if (company == null) company = "";
    if (UbT_LocalADUuser == null) UbT_LocalADUuser = "";
    if (buAgrupada == null) buAgrupada = "";
    if (reportingLine == null) reportingLine = "";

    itemsSeleccionados = new Array();

    let urlPost = URLBACKEND + "pmProcess/consultPrincipalReportingLineProducts?COU_ID=" + company
        + "&BU_AGRUPADA=" + userLogged.bu_agrupada
        + "&UBT_LocalADUuser=" + UbT_LocalADUuser
        + "&PRINCIPAL_ERP_NUMBER=" + principal
        + "&REPORTING_LINE=" + encodeURIComponent(reportingLine)
        + "&LOST=TRUE"
        + "&ROL=" + ((esBUM) ? "BUM" : "PM")
        + "&" + $.param(params.data);
    $.get({
        url: urlPost,
        type: 'Get'//,
        //timeout: 1000
    }).then(tableData => {

        var meta2 = JSON.parse(window.localStorage.getItem(APP_NAME + "myRows"));
        if (meta2 === null) {
            let itemsSeleccionados = new Array();
            tableData.forEach(row => {
                itemsSeleccionados.push(row);
            });
            window.localStorage.setItem(APP_NAME + "myRows", JSON.stringify(itemsSeleccionados));
        }
        else {
            tableData.forEach(row => {
                meta2.push(row);
            });
            window.localStorage.setItem(APP_NAME + "myRows", JSON.stringify(meta2));
        }


        params.success(tableData);
    }).catch(e => {
        params.error();
        //$table.bootstrapTable('removeAll');
    });
}


function selectOption(guardado, row) {
    let options = "";
    months.map(itm => {
        if (itm.id == guardado)
            options += "<option selected value='" + itm.id + "'>" + itm.name + "</option>"
        else
            options += "<option value='" + itm.id + "'>" + itm.name + "</option>"
    });
    return options;
}


function loadLostProducts() {
    var $table = $('#tableitems');
    var $table_selected = $("#tableitems-selected");
    localStorage.removeItem(APP_NAME + "myRows");
    localStorage.removeItem(APP_NAME + "selectedRows");
    $table.bootstrapTable('load', []);
    $table_selected.bootstrapTable('load', []);
    $table.bootstrapTable('refresh');
    $table_selected.bootstrapTable('refresh');
    $table.bootstrapTable({
        columns: [
            {
                field: '',
                title: '',
                checkbox: true,
                visible: true,
                width: '10%',
                widthUnit: '%'
            },
            {
                field: 'PRODUCT_NAME',
                title: 'PRODUCT NAME',
                sortable: true,
                align: 'center',
                visible: true,
                width: '50%',
                widthUnit: '%'
            }
        ],
        onCheck: function (row, element) {
            // Persist on LocalStorage
            var meta1 = JSON.parse(window.localStorage.getItem(APP_NAME + "selectedRows"));
            if (meta1 === null) {
                let itemsSeleccionados = new Array();
                itemsSeleccionados.push(row);
                window.localStorage.setItem(APP_NAME + "selectedRows", JSON.stringify(itemsSeleccionados));
            }
            else {
                meta1.push(row);
                window.localStorage.setItem(APP_NAME + "selectedRows", JSON.stringify(meta1));
            }
        },
        onCheckAll: function (rowsselected) {
            // Persist on LocalStorage
            var meta1 = JSON.parse(window.localStorage.getItem(APP_NAME + "selectedRows"));

            if (meta1 === null) {
                let itemsSeleccionados = new Array();
                itemsSeleccionados = itemsSeleccionados.concat(rowsselected);
                window.localStorage.setItem(APP_NAME + "selectedRows", JSON.stringify(itemsSeleccionados));
            }
            else {
                Object.values(rowsselected).forEach(row => {
                    var flag = true;
                    Object.values(meta1).forEach(it => {
                        if (row.PRODUCT_NAME === it.PRODUCT_NAME)
                            flag = false;
                    });
                    if (flag)
                        meta1.push(row);
                });
                window.localStorage.setItem(APP_NAME + "selectedRows", JSON.stringify(meta1));
            }
        },
        onUncheck: function (row, element) {
            // Persist on LocalStorage
            var meta1 = JSON.parse(window.localStorage.getItem(APP_NAME + "selectedRows"));
            meta1 = meta1.filter(itm => !(itm.PRODUCT_NAME === row.PRODUCT_NAME));
            window.localStorage.setItem(APP_NAME + "selectedRows", JSON.stringify(meta1));
        },
        onUncheckAll: function (rowsselected) {
            var $table = $('#tableitems');
            var itemsEnTabla = $table.bootstrapTable('getData');
            // Persist on LocalStorage
            var meta1 = JSON.parse(window.localStorage.getItem(APP_NAME + "selectedRows"));
            Object.values(itemsEnTabla).forEach(it => {
                meta1 = meta1.filter(itm => !(itm.PRODUCT_NAME === it.PRODUCT_NAME));
            });
            window.localStorage.setItem(APP_NAME + "selectedRows", JSON.stringify(meta1));
        }
    });
    $table_selected.bootstrapTable({
        columns: [
            {
                field: '',
                title: '',
                checkbox: true,
                visible: true,
                width: '10%',
                widthUnit: '%'
            },
            {
                field: 'PRODUCT_NAME',
                title: 'PRODUCT NAME',
                sortable: true,
                align: 'center',
                visible: true,
                width: '50%',
                widthUnit: '%'
            },
            {
                field: 'MONTH',
                title: 'MONTH',
                sortable: true,
                align: 'center',
                visible: true,
                width: '50%',
                widthUnit: '%',
                formatter: function (value, row, index) {
                    let id = 'select-month' + index
                    return '<select id="' + id + '" class="form-control"row-index="'+ index +'" field="MONTH" onchange="updateCell($(this))">' + selectOption(row.MONTH, row) + '</select>';
                },
            }
        ],
        onCheck: function (row, element) {
            itemsSeleccionadosTableSelected.push(row);
        },
        onCheckAll: function (rowsselected) {
            itemsSeleccionadosTableSelected = [];
            itemsSeleccionadosTableSelected = itemsSeleccionadosTableSelected.concat(rowsselected);
        },
        onUncheck: function (row, element) {
            itemsSeleccionadosTableSelected = itemsSeleccionadosTableSelected.filter(itm => itm.PRODUCT_NAME != row.PRODUCT_NAME);
        },
        onUncheckAll: function (rowsselected) {
            itemsSeleccionadosTableSelected = [];
        }
    });
}


function updateCell(caller) {
  var table = caller.parents('table');
  var newData = {
    index: caller.attr('row-index'), field: caller.attr('field'), value: caller.val(), reinit: false
  };

  table.bootstrapTable('updateCell', newData);
}

async function selectItems(e) {
    if (e)
        e.preventDefault();

    var meta1 = JSON.parse(window.localStorage.getItem(APP_NAME + "selectedRows"));
    if (meta1 !== null) {
        var meta2 = JSON.parse(window.localStorage.getItem(APP_NAME + "myRows"));
        if (meta2 !== null) {
            var meta2Copy = meta1.map(obj => {
                var objCopy = { ...obj };
                objCopy['MONTH'] = (objCopy['MONTH'] == undefined) ? months[0].id : objCopy['MONTH'];
                return objCopy;
            });
            meta2 = meta2.concat(meta2Copy);
            window.localStorage.setItem(APP_NAME + "myRows", JSON.stringify(meta2));
        }
        else {
            meta2 = meta1.map(obj => {
                var objCopy = { ...obj };
                objCopy['MONTH'] = months[0].id;
                return objCopy;
            });

            window.localStorage.setItem(APP_NAME + "myRows", JSON.stringify(meta1));
        }

        var $table_selected = $('#tableitems-selected');
        $table_selected.bootstrapTable('load', meta2);
        for (var i = 1; i <= $('#tableitems-selected').bootstrapTable('getOptions').totalPages; i++) {
            $('#tableitems-selected').bootstrapTable('selectPage', i);
            $('#tableitems-selected').bootstrapTable('uncheckAll');
        }
        $('#tableitems-selected').bootstrapTable('selectPage', 1);
        $('#tableitems').bootstrapTable('getSelections').forEach(option => {
            $('#tableitems').bootstrapTable('removeByUniqueId', option.PRODUCT_NAME);
        })
        let hayitems = $table_selected.bootstrapTable('getData');
        if (hayitems.length > 0)
            if (hayitems[0].PRODUCT_NAME) {
                //await PersistProductsAndFilters();
                //$('#tableitems').bootstrapTable('refresh');
            }
        // Save rows in selectedTable to not show in filter table
        localStorage.removeItem(APP_NAME + "selectedRows");
    }
}

async function unselectItems(e) {
    if (e)
        e.preventDefault();

    var $table = $('#tableitems')
    var $table_selected = $('#tableitems-selected');
    var itemsEliminar = $table_selected.bootstrapTable('getSelections');

    if (itemsEliminar.length > 0) {
        //await deleteProductosSeleccionados(UNIVERSE_HEADER.PPCH_Id);
        var meta1 = [];
        meta1.concat(itemsEliminar);
        window.localStorage.setItem(APP_NAME + "selectedRows", JSON.stringify(meta1));
        $table.bootstrapTable('load', $table.bootstrapTable('getData').concat(itemsEliminar));
        for (var i = 1; i <= $table.bootstrapTable('getOptions').totalPages; i++) {
            $table.bootstrapTable('selectPage', i);
            $table.bootstrapTable('uncheckAll');
        }

        $table.bootstrapTable('selectPage', 1);
        itemsEliminar.map((index, input) => {

            $table_selected.bootstrapTable('removeByUniqueId', index.PRODUCT_NAME);
        });
        //$table.bootstrapTable('refresh');

        // Persist on LocalStorage
        var meta2 = JSON.parse(window.localStorage.getItem(APP_NAME + "myRows"));
        Object.values(itemsEliminar).forEach(it => {
            meta2 = meta2.filter(itm => !(itm.PRODUCT_NAME === it.PRODUCT_NAME));
        });
        window.localStorage.setItem(APP_NAME + "myRows", JSON.stringify(meta2));
    }
}


async function saveProductsLost(button){

    if (validacionLostProducts(button.id)){
        var formDataLostProduct = new FormData();

        formDataLostProduct.append('COU_Id', $('#select-company').val());
        formDataLostProduct.append('PRINCIPAL_ERP_NUMBER', $('#select-principal').val());
        formDataLostProduct.append('PRINCIPAL_REPORTING_LINE', encodeURIComponent($('#select-principalRepLine').val()));
        formDataLostProduct.append('BU_AGRUPADA', userLogged.bu_agrupada);
        formDataLostProduct.append('UBT_LocalADUuser', userLogged.UbT_LocalADUuser);
        var $table = $('#tableitems')
        var $table_selected = $('#tableitems-selected');
        var products;
        if (button.id == 'saveRepLineLostProducts'){
            formDataLostProduct.append('COMMENTS', $('#comments-lostProduct').val());
            formDataLostProduct.append('MONTH', $('#select-month').val());
        }else{
            products =  $table_selected.bootstrapTable('getData');
        }

        var items = [];

        for (let [key, val] of formDataLostProduct.entries()) {
            items.push({[key]: val });
        }

        if (products != undefined)
            items.push({'PRODUCTS': products});

        await $.post(URLBACKEND + "pmProcess/saveLostProducts", "items=" + JSON.stringify(items));
        loadLostProducts();
        return true;
    }else{
        return false;
    }
}

function validacionLostProducts(buttonID){
    var validationObject = { 'valid': true };

    var $table = $('#tableitems')
    var $table_selected = $('#tableitems-selected');
    var products = $table.bootstrapTable('getData')
    var lostProducts = $table_selected.bootstrapTable('getData');


        if (buttonID == 'saveRepLineLostProducts'){
            var comments = $('#comments-lostProduct').val();
            var month = $('#select-month').val();

            if (month == ''){
                validationObject.valid = false;
                swal('Validation Error', 'The Month of the products post cannot be empty', 'error');
            }

        }else{
            var selectsMonth = Array.from(document.querySelectorAll('#tableitems-selected select')).filter(select => select.value == '');
            if(selectsMonth.length > 0){
                validationObject.valid = false;
                swal('Validation Error', 'The Month of the Products Lost cannot be Empty', 'error');
            }
        }

    return validationObject.valid;
}