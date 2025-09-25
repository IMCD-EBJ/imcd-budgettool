editar = false;
var checkedValue = '0';
var processFinalized = false;
var dataCustomerOriginal;
var dataCustomerModificada;
var headersHorizontalTotales = [
    {'id': 'LYR', 'label': 'LYR'},
    {'id': 'FCS', 'label': 'FCS'},
    //{'id': 'BDG_ROY', 'label': 'BDG ROY (CY)'},
    {'id': 'BDG', 'label': 'BDG'}
];
var UbT_LocalADUuser;
var typedChecked = ['A', 'B', 'C'];
var requiredFields = [];
var maxVariationQuantity;
$(document).ready(function () {
    UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
    clean();
    var saveButton = document.getElementById('saveButton');
    saveButton.onclick = function (event) {
        event.preventDefault();
        save();
    }

    Array.from(document.querySelectorAll('#buttonsCustomer button')).forEach(button => {
        button.disabled = true;
    });
    createTablesTotales();
    ;
    arrayInputsOrdenados = Array.from(document.querySelectorAll('input.editable')).sort((a, b) => {
        var idA = parseInt(a.id.split('/')[1]);
        var idB = parseInt(b.id.split('/')[1]);

        return idA - idB;
    });

    var bum = localStorage.getItem('activeRol') == 'BUM';
    getConfigurationParam('CFG_ShowSRProcessFinalizeProcess').then(data => {
        if (data.CFG_ShowSRProcessFinalizeProcess == '0') {
            $('#divLogSRProcess').hide();
        }
    });

    getConfigurationParam('CFG_SRProcessQuantityMaxVariation').then(data => {
        maxVariationQuantity = data['CFG_SRProcessQuantityMaxVariation'];
    });

    if (bum) {
        $('#commentsForm').hide();
        $('#divLogSRProcess').hide();
    }
});


async function getActualStatus() {
    var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;

    $.get({
        url: URLBACKEND + "srProcess/getActualStatus?UBT_LocalADUuser=" + UbT_LocalADUuser
            + "&BU_AGRUPADA=" + userLogged.bu_agrupada
            //+ "&ROL=" + ((esBUM) ? "BUM" : "SR"),
            + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'SR'),
        type: 'Get'
    }).then(data => {
        if (data.length > 0) {
            generateActualStatusForSR(data);
        }
    });
}

async function loadPrincipals() {
    const businessType = $('#select-businessType').val();
    const incomeType = $('#select-incomeType').val();

    $("#select-principal").find('option').remove();
    $("#select-principal").append('<option value="">select an option</option>');

    await loadDropDown(
        $("#select-principal"),
        "srProcess/listPrincipals?UBT_LocalADUuser=" + UbT_LocalADUuser
            + "&INCOME_TYPE=" + encodeURIComponent(incomeType || '')
            + "&BUSINESS_TYPE=" + encodeURIComponent(businessType || '')
            + "&BU_AGRUPADA=" + userLogged.bu_agrupada
            + "&CHECKED=" + checkedValue
            + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'SR')
            + "&TYPE=" + encodeURIComponent(typedChecked.toString()),
        "id", "name"
    );

    // Autoselect si solo hay 1 opción real además del placeholder
    if (document.getElementById('select-principal').options.length == 2) {
        await nextSelectedOption('select-principal');
    }
}

async function onSelectPrincipalChange() {
    const businessType = $('#select-businessType').val();
    const incomeType = $("#select-incomeType").val();
    const principal = $("#select-principal").val();
    const customerPrev = $('#select-customer').val(); // por si quieres intentar mantener selección

    $("#select-customer").find('option').remove();
    $("#select-customer").append('<option value="">select an option</option>');

    await loadDropDown($("#select-customer"),
        "srProcess/listCustomers?UBT_LocalADUuser=" + UbT_LocalADUuser
        + "&INCOME_TYPE=" + encodeURIComponent(incomeType || '')
        + "&BUSINESS_TYPE=" + encodeURIComponent(businessType || '')
        + "&PRINCIPAL=" + encodeURIComponent(principal || '')
        + "&BU_AGRUPADA=" + userLogged.bu_agrupada
        + "&CHECKED=" + checkedValue
        + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'SR')
        + "&TYPE=" + encodeURIComponent(typedChecked.toString()),
        "id", "name"
    );

    // Si el antiguo customer sigue disponible, lo preservamos
    if (customerPrev && $("#select-customer option[value='" + customerPrev + "']").length) {
        $('#select-customer').val(customerPrev);
        await onSelectCustomerChange();
    } else {
        await nextSelectedOption('select-customer');
        // si no hay customer seleccionado, limpia tablas/botón guardar:
        if ($('#select-customer').val() == '') {
            $('#divTables').hide();
            $("#saveButton").prop("disabled", true);
        }
    }
}


async function getValuesForTotales(tableType, customer) {
    const principal = $('#select-principal').val() || '';
    $.get({
        url: URLBACKEND + "srProcess/getTotales?UBT_LocalADUuser=" + UbT_LocalADUuser
            + "&customer=" + customer
            + "&TABLE_TYPE=" + tableType
            + "&PRINCIPAL=" + encodeURIComponent(principal)     // <-- NUEVO
            + "&BU_AGRUPADA=" + userLogged.bu_agrupada
            + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'SR'),
        type: 'Get'
    }).then(data => {
        data.forEach(arrayInputs => {
            arrayInputs.forEach(dataInputs => {
                Object.entries(dataInputs).forEach(([key, value]) => {
                    var valueObject;
                    if (key.includes('VAR')) {
                        valueObject = (Math.round((parseFloat(value) + Number.EPSILON) * 10) / 10).toString().replaceAll('.', ',')
                    } else if (key.includes('PERC')) {
                        valueObject = (Math.round((parseFloat(value) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',');
                    } else if (key.includes('QTY')) {
                        valueObject = value.replaceAll('.', ',');
                    } else {
                        valueObject = putThousandsMask(Math.round(value));
                    }
                    if (!key.includes('/LYR/VAR'))
                        document.getElementById(key).value = valueObject;
                });
            });
        });
    });
}

function generateActualStatusForSR(data) {
    var totalFinished = 0;
    var totalCustomers = data[0].totalCustomers;
    var actualStatusBody = document.getElementById('actualStatusBody');
    $('#actualStatusBody').empty();
    data.forEach(type => {
        if (type.checked > 0) {
            totalFinished += parseInt(type.checked);
        }
        var div = document.createElement('div');

        div.className = 'actualStatusElement';
        var divInner = document.createElement('div');
        divInner.classList.add('row');
        var divName = document.createElement('div');
        divName.classList.add('col-md-6');
        var text = document.createTextNode((esBUM || esMM) ? capitalizeFirstLetterString(type.title) : type.title);
        divName.appendChild(text);
        divInner.appendChild(divName);

        var divQuantity = document.createElement('div');
        divQuantity.classList.add('col-md-6');
        var text = document.createTextNode(type.checked + '/' + type.total + ' \tCustomers');
        divQuantity.appendChild(text);
        divInner.appendChild(divQuantity);
        div.appendChild(divInner);
        actualStatusBody.appendChild(div);
    });
    $('#actualStatus').show();
    $('#recordsReported').empty();
    $('#recordsReported').append('Actual Status: ' + totalFinished + '/' + totalCustomers + ' Customers Done');
}

function createTablesTotales() {
    var tablesTotalSR = Array.from(document.querySelectorAll('#totalSRForm table'));
    var tablesTotalCustomer = Array.from(document.querySelectorAll('#totalCustomerForm table'));

    tablesTotalSR.forEach(table => {
        var tableName = table.getAttribute('name');
        var configTable = {'isTotales': true, 'tableName': tableName};
        if (tableName == 'totalMgmSR') {
            configTable['withHeaders'] = true;
        } else {
            configTable['withHeaders'] = false;
        }
        table.append(createTbodyTable('totalSR/' + tableName, table, configTable));
    });

    tablesTotalCustomer.forEach(table => {
        var tableName = table.getAttribute('name');
        var configTable = {'isTotales': true, 'tableName': tableName};
        if (tableName == 'totalMgmSR') {
            configTable['withHeaders'] = true;
        } else {
            configTable['withHeaders'] = false;
        }
        table.append(createTbodyTable('totalCustomer/' + tableName, table, configTable));
    });
}

function createTbodyTable(prefixIdInput, table, configTable) {
    var tbody = document.createElement('tbody');
    var thArray = Array.from(table.querySelectorAll('th')).filter(th =>
        th.getAttribute('name') != null && th.getAttribute('colspan') == null
    ).map((th) =>
        ({name: th.getAttribute('name'), editable: th.getAttribute('editable')})
    );

    if (configTable.isTotales) {
        headersHorizontalTotales.forEach(headerHorizontal => {
            var configHeader = {'header': headerHorizontal, 'display': configTable.withHeaders};
            tbody.appendChild(createTrTbodyTotales(prefixIdInput + '/' + configHeader.header.id, configHeader, thArray, configTable.tableName));
        });
    }
    return tbody;
}


function createTrTbodyTotales(prefixIdInput, configHeader, thArray, tableName) {
    var tr = document.createElement('tr');
    if (configHeader.display) {
        var thHorizontal = document.createElement('th');
        thHorizontal.classList.add('headerHorizontal');
        var divThHorizontal = document.createElement('div');
        divThHorizontal.classList.add('mt-2');
        divThHorizontal.appendChild(document.createTextNode(configHeader.header.label));
        thHorizontal.appendChild(divThHorizontal);
        tr.appendChild(thHorizontal);
    }

    thArray.forEach(th => {
        //if (th.name != 'VAR' || configHeader.header.id != 'LYR' || tableName != 'totalMgmSR') {
        if (th.name != 'VAR' || configHeader.header.id != 'LYR') {
            var td = document.createElement('td');
            td.appendChild(createInput(prefixIdInput + '/' + th.name, th.editable));
            tr.appendChild(td);
        }
    });
    return tr;
}

function createInput(idInput, editable, hidden, functionOnChange) {

    var input = document.createElement('input');
    input.name = idInput;
    input.id = idInput;

    input.className = (hidden == 'true') ? 'hidden' : "form-control text-center ";
    input.setAttribute('type', 'text');

    input.value = 0;
    input.setAttribute('readonly', 'true');
    input.setAttribute('editable', editable);

    if (editable == 'true') {
        if (idInput.startsWith('GMP')) {
            input.setAttribute('onkeypress', 'isDecimalPercentKey(event,this)');
        } else {
            input.setAttribute('onkeypress', 'isIntegerKey(event,this)');
        }
        input.onchange = function () {
            checkCambiosRealizados();
            if (input.value == '') {
                input.value = 0;
            }
            if (input.value.indexOf(",") > 0) {
                if (input.value.split(',')[1].length >= 2) {
                    input.value = (Math.round((parseFloat(input.value.replaceAll(',', '.')) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',')
                }
            }

            if (input.value != '-') {
                input.classList.remove('errorValue');
            }

            if (input.id.includes('QTY')) {
                var idInputSplit = input.id.split('/');
                var indexCustomer = parseInt(idInputSplit[1]);
                var idInputs = ['QTY BDG', 'QTY ROY'];
                var hayVariacion = false;
                idInputs.forEach(idInput => {
                    var input = document.getElementById(idInput + '/' + indexCustomer);
                    var valueOriginalInput = dataCustomerOriginal[indexCustomer][idInput];
                    var variacionValor = parseFloat(removeThousandsMask(input.value).replaceAll(',','.')) - parseFloat(valueOriginalInput.replaceAll(',', '.'));

                    var valorMaximoVariacion = parseFloat(valueOriginalInput.replaceAll(',', '.')) * parseFloat(maxVariationQuantity) / 100;

                    if (Math.abs(variacionValor) > valorMaximoVariacion) {
                        hayVariacion = true;
                     }
                });

                if (hayVariacion) {
                    var selectComments = document.getElementById('select-comment-' + indexCustomer);
                    selectComments.classList.add('obligatorio')
                    requiredFields.push({'id': 'select-comment-' + indexCustomer})
                } else {
                    var selectComments = document.getElementById('select-comment-' + indexCustomer);
                    selectComments.classList.remove('obligatorio');
                    requiredFields = requiredFields.filter(field => field.id != 'select-comment-' + indexCustomer);
                }
            }
            try {
                functionOnChange();
                checkCorrectValue();
            } catch (e) {
            }
        }
        input.onfocus = function (event) {
            if (event.target.value == '0') {
                event.target.value = '';
            } else {
                event.target.value = removeThousandsMask(event.target.value);
            }

            actualInput = arrayInputsOrdenados.indexOf(event.target);

            event.target.select();
        }
        input.onfocusout = function (event) {
            event.target.value = putThousandsMask(event.target.value);
            if (input.value == '') {
                input.value = 0;
            }
            if (input.value.indexOf(",") > 0) {
                if (input.value.split(',')[1].length >= 2) {
                    input.value = (Math.round((parseFloat(input.value.replaceAll(',', '.')) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',')
                }
            }
            if (event.target.id.includes('%') || event.target.id.startsWith('GMP')) {
                if (input.value != '-') {
                    input.value = checkDecimals(input.value, 'PERC');
                }

            }
        }
    }

    return input;
}

async function checked_Change(event) {
    if (isCambiosRealizados) {
        getAlertMessage("UNSAVED_CHANGES_WAR", async function (isConfirm) {
            if (isConfirm) {
                isCambiosRealizados = false;
                var company = $("#select-businessType").val();
                checkedValue = (event.target.checked) ? '1' : '0';
                clean()
            } else {
                event.target.checked = !event.target.checked;
            }
        });
    } else {
        var company = $("#select-businessType").val();
        checkedValue = (event.target.checked) ? '1' : '0';
        clean()
    }
}

async function typeChanged(event) {
    if (isCambiosRealizados) {
        getAlertMessage("UNSAVED_CHANGES_WAR", async function (isConfirm) {
            if (isConfirm) {
                isCambiosRealizados = false;
                const idCheckbox = event.target.id;
                if (typedChecked.includes(idCheckbox)) {
                    typedChecked.splice(typedChecked.indexOf(idCheckbox), 1);
                } else {
                    typedChecked.push(idCheckbox);
                }
                clean()
            } else {
                event.target.checked = !event.target.checked;
            }
        });
    } else {
        const idCheckbox = event.target.id;
        if (typedChecked.includes(idCheckbox)) {
            typedChecked.splice(typedChecked.indexOf(idCheckbox), 1);
        } else {
            typedChecked.push(idCheckbox);
        }
        clean();
    }
}

function getQTYRoyData(data) {

    var tableQtyRoy = document.getElementById('tableQtyRoy');
    var tbody = tableQtyRoy.querySelector('tbody');

    $('#tableQtyRoy tbody').empty();

    data.forEach((customer, index) => {
        var firstTrConfig = [
            {'colspan': '2', 'element': 'div', 'class': 'firstTr empty', text: 'Item'},
            {
                'id': 'ITEM_NUMBER/' + index,
                'colspan': '2',
                'element': 'div',
                'class': 'firstTr',
                property: 'ITEM_NUMBER'
            },
            {
                'id': 'ITEM_NAME/' + index,
                'colspan': '3',
                'element': 'div',
                'class': 'firstTr empty',
                property: 'ITEM_NAME'
            },
            {'colspan': '1', 'element': 'div', 'class': 'firstTr empty', text: ' '},
            {
                'id': 'BusinessType/' + index,
                'colspan': '5',
                'element': 'div',
                'class': 'firstTr empty',
                property: 'BusinessType-IncomeType'
            }
        ];

        customer["BusinessType-IncomeType"] = customer["BusinessType"] + " - " + customer["INCOME TYPE"]
        createFilaDatos(firstTrConfig, tableQtyRoy, customer, index, calcQtyRoy).forEach(tr => {
            tbody.appendChild(tr);
        });

    })
}

function getGMPercRoyData(data) {

    var tableGmPERCRoy = document.getElementById('tableGmPERCRoy');
    var tbody = tableGmPERCRoy.querySelector('tbody');

    $('#tableGmPERCRoy tbody').empty();

    data.forEach((customer, index) => {
        var firstTrConfig = [
            {'colspan': '1', 'element': 'div', 'class': 'firstTr empty', text: 'Principal'},
            {
                'id': 'PRINCIPAL_NUMBER/' + index,
                'colspan': '1',
                'element': 'div',
                'class': 'firstTr',
                property: 'PRINCIPAL_NUMBER'
            },
            {
                'id': 'PRINCIPAL_NAME/' + index,
                'colspan': '3',
                'element': 'div',
                'class': 'firstTr empty',
                property: 'PRINCIPAL_NAME'
            }
        ];
        createFilaDatos(firstTrConfig, tableGmPERCRoy, customer, index, calcGMRoy).forEach(tr => {
            tbody.appendChild(tr);
        });

    })
}


async function getTableBDGData(data) {

    const tablePercentage = document.getElementById('tableBDG');
    const tbody = tablePercentage.querySelector('tbody');

    $('#tableBDG tbody').empty();
    for (const customer of data) {
        const index = data.indexOf(customer);

        var firstTrConfig = [
            {'colspan': '2', 'element': 'div', 'class': 'firstTr empty', 'text': 'Comments'},
            {
                'id': 'select-comment-' + index,
                'colspan': '7',
                'element': 'select',
                'property': 'COMMENTS',
                'class': 'form-control editable'
            },
        ];
        createFilaDatos(firstTrConfig, tablePercentage, customer, index, calcBDG).forEach(tr => {
            tbody.appendChild(tr);
        });
        await loadDropDown($("#select-comment-" + index), "srProcess/getSelectOptionsBudgetData", "value", "text");
        Array.from(document.getElementById('select-comment-' + index).options)[0].innerText = 'Insert a comment';

        if (customer['COMMENTS'] != null) {
            document.getElementById('select-comment-' + index).value = customer['COMMENTS'];
        }
    }
}


function createFilaDatos(firstTrConfig, table, customer, index, functionOnChange) {
    var thArray = Array.from(table.querySelectorAll('th')).filter(th =>
        th.getAttribute('name') != null && th.getAttribute('colspan') == null
    ).map((th) =>
        ({name: th.getAttribute('name'), editable: th.getAttribute('editable'), hidden: th.getAttribute('hidden')})
    );

    const firstTr = document.createElement('tr');
    firstTr.setAttribute('index', index);


    firstTrConfig.forEach(tdConfig => {
        var td = document.createElement('td');
        td.setAttribute('colspan', tdConfig.colspan);
        var element = document.createElement(tdConfig.element);
        element.className = tdConfig.class;
        element.id = tdConfig.id;

        if (tdConfig.element == 'div') {
            var textDiv = (tdConfig.property != undefined) ? customer[tdConfig.property] : tdConfig.text;
            element.appendChild(document.createTextNode(textDiv));
            td.appendChild(element);
        }

        td.appendChild(element);
        firstTr.appendChild(td);
    });

    const secondTr = document.createElement('tr');
    secondTr.setAttribute('index', index);

    thArray.forEach(thConfig => {
        var td = document.createElement('td');
        var objectBind = {'thName': thConfig.name, 'customerIndex': index};
        var input = createInput(thConfig.name + '/' + index, thConfig.editable, thConfig.hidden, functionOnChange.bind(objectBind));
        var value;
        if (customer[thConfig.name] == null) {
            customer[thConfig.name] = '0';
        }
        if (thConfig.hidden == 'true') {
            td.className = 'hidden';
            value = customer[thConfig.name].replaceAll('.', ',');
        } else if (thConfig.name.includes('VAR')) {
            value = (Math.round((parseFloat(customer[thConfig.name]) + Number.EPSILON) * 10) / 10).toString().replaceAll('.', ',');
            value = checkDecimals(value, 'VAR');
        } else if (thConfig.name.includes('%') || thConfig.name.includes('GMP')) {
            value = (Math.round((parseFloat(customer[thConfig.name]) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',');
            value = checkDecimals(value, 'PERC');
        } else if (thConfig.name == 'UNIT PRICE ROY' || thConfig.name == 'UNIT PRICE BDG'
            || thConfig.name == 'UNIT MARGIN ROY' || thConfig.name == 'UNIT MARGIN BDG') {
            value = (Math.round((parseFloat(customer[thConfig.name]) + Number.EPSILON) * 10000) / 10000).toString().replaceAll('.', ',');
        } else {
            value = putThousandsMask(Math.round(customer[thConfig.name]));
        }
        input.value = value;
        td.appendChild(input);
        secondTr.appendChild(td);
    });

    const trs = [firstTr, secondTr];
    return trs;
}

function calcTotalesQtyRoy(indexCustomer, qtyFcs, invFCS, gmFCS) {
    var qtyFCSTotalSRTotalSR = document.getElementById('totalSR/totalSR/FCS/QTY');
    var qtyFCSCustomerTotalTotalSR = document.getElementById('totalCustomer/totalSR/FCS/QTY');
    var gmLYRTotalSRTotalSR = document.getElementById('totalSR/totalSR/LYR/GM');
    var gmLYRCustomerTotalTotalSR = document.getElementById('totalCustomer/totalSR/LYR/GM');


    var qtyFCSOriginal = parseInt(dataCustomerModificada[indexCustomer]['QTY FCS']);
    qtyFCSTotalSRTotalSR.value = parseFloat((qtyFCSTotalSRTotalSR.value.replaceAll(',', '.'))) - qtyFCSOriginal + parseInt(qtyFcs.value);
    qtyFCSCustomerTotalTotalSR.value = parseFloat((qtyFCSCustomerTotalTotalSR.value.replaceAll(',', '.'))) - qtyFCSOriginal + parseInt(qtyFcs.value);
    dataCustomerModificada[indexCustomer]['QTY FCS'] = qtyFcs.value;

    var invFCSTotalSRTotalSR = document.getElementById('totalSR/totalSR/FCS/INV');
    var invFCSCustomerTotalSR = document.getElementById('totalCustomer/totalSR/FCS/INV');


    var invFCSOriginal = parseInt(dataCustomerModificada[indexCustomer]['INV FCS']);
    invFCSTotalSRTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(invFCSTotalSRTotalSR.value)) - invFCSOriginal + parseInt(invFCS.value));
    invFCSCustomerTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(invFCSCustomerTotalSR.value)) - invFCSOriginal + parseInt(invFCS.value));
    dataCustomerModificada[indexCustomer]['INV FCS'] = invFCS.value;

    var gmFCSTotalSRTotalSR = document.getElementById('totalSR/totalSR/FCS/GM');
    var gmFCSCustomerTotalSR = document.getElementById('totalCustomer/totalSR/FCS/GM');
    var gmFCSOriginal = parseInt(dataCustomerModificada[indexCustomer]['GM FCS']);
    gmFCSTotalSRTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(gmFCSTotalSRTotalSR.value)) - gmFCSOriginal + parseInt(gmFCS.value));
    gmFCSCustomerTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(gmFCSCustomerTotalSR.value)) - gmFCSOriginal + parseInt(gmFCS.value));
    dataCustomerModificada[indexCustomer]['GM FCS'] = gmFCS.value;

    var fcsGMPTotalSRTotalSR = document.getElementById('totalSR/totalSR/FCS/GMPERC');
    var fcsGMPcustomerTotalSR = document.getElementById('totalCustomer/totalSR/FCS/GMPERC');
    var gmpTotalSRTotalSRNewValue = parseInt(removeThousandsMask(gmFCSTotalSRTotalSR.value)) / parseInt(removeThousandsMask(invFCSTotalSRTotalSR.value)) * 100;
    var gmpCustomerTotalSRNewValue = parseInt(removeThousandsMask(gmFCSCustomerTotalSR.value)) / parseInt(removeThousandsMask(invFCSCustomerTotalSR.value)) * 100;
    fcsGMPTotalSRTotalSR.value = (Math.round((gmpTotalSRTotalSRNewValue + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',');
    fcsGMPcustomerTotalSR.value = (Math.round((gmpCustomerTotalSRNewValue + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',');

    var varPercQtyFcsVsLyrTotalSRTotalSR = document.getElementById('totalSR/totalSR/FCS/VAR');
    var varPercQtyFcsVsLyrCustomerTotalSR = document.getElementById('totalCustomer/totalSR/FCS/VAR');

    var qtyLYRTotalSRTotalSR = document.getElementById('totalSR/totalSR/LYR/QTY');
    var qtyLYRCustomerTotalSR = document.getElementById('totalCustomer/totalSR/LYR/QTY');

    var valueVarPerc = (((parseInt(gmFCSTotalSRTotalSR.value) / parseInt(gmLYRTotalSRTotalSR.value)) - 1) * 100).toString();
    varPercQtyFcsVsLyrTotalSRTotalSR.value = (Math.round((parseFloat(valueVarPerc) + Number.EPSILON) * 10) / 10).toString().replaceAll('.', ',')

    var valueVarPerc = (((parseInt(gmFCSCustomerTotalSR.value) / parseInt(gmLYRCustomerTotalTotalSR.value)) - 1) * 100).toString();
    varPercQtyFcsVsLyrCustomerTotalSR.value = (Math.round((parseFloat(valueVarPerc) + Number.EPSILON) * 10) / 10).toString().replaceAll('.', ',')
}

function calcQtyRoy() {
    var indexCustomer = this.customerIndex;
    var dataCustomer = {};
    Object.entries(getDataFromInputs('customerForm')).forEach(([key, value]) => {
        var keySplit = key.split('/')
        if (parseInt(keySplit[1]) == indexCustomer) {
            dataCustomer[keySplit[0]] = {'value': value, 'idInput': key};

        }
    });

    var unitPriceRoy = dataCustomer['UNIT PRICE ROY'];
    var qtyFcs = dataCustomer['QTY FCS'];
    var qtyYtd = dataCustomer['QTY YTD'];
    var qtyRoy = dataCustomer['QTY ROY'];
    var invRoy = dataCustomer['INV ROY'];
    var invFCS = dataCustomer['INV FCS'];
    var invYTD = dataCustomer['INV YTD'];
    var qtyLyr = dataCustomer['QTY LYR'];
    var varPercQtyFcsVsLyr = dataCustomer['VAR% QTY FCS vs LYR'];
    var unitMarginRoy = dataCustomer['UNIT MARGIN ROY'];
    var gmRoy = dataCustomer['GM ROY'];
    var gmFCS = dataCustomer['GM FCS'];
    var gmYTD = dataCustomer['GM YTD'];
    var gmpRoy = dataCustomer['GMP ROY']
    var gmpFCS = dataCustomer['GMP FCS']
    var costRoy = dataCustomer['COST ROY']
    var costFCS = dataCustomer['COST FCS']

    qtyFcs.value = (parseInt(qtyYtd.value) + parseInt(qtyRoy.value)).toString();
    invRoy.value = (parseInt(qtyRoy.value) * parseFloat(unitPriceRoy.value)).toString();
    invFCS.value = (parseFloat(invRoy.value) + parseFloat(invYTD.value)).toString();
    varPercQtyFcsVsLyr.value = (((parseInt(qtyFcs.value) / parseInt(qtyLyr.value)) - 1) * 100).toString();
    gmRoy.value = (parseFloat(unitMarginRoy.value) * parseInt(qtyRoy.value)).toString();
    gmFCS.value = (parseFloat(gmRoy.value) + parseFloat(gmYTD.value)).toString();
    gmpRoy.value = (parseFloat(gmRoy.value) / parseFloat(invRoy.value) * 100).toString();
    gmpFCS.value = (parseFloat(gmFCS.value) / parseFloat(invFCS.value) * 100).toString();
    costRoy.value = (parseFloat(invRoy.value) - parseFloat(gmRoy.value)).toString();
    costFCS.value = (parseFloat(invFCS.value) - parseFloat(gmFCS.value)).toString();


    calcTotalesQtyRoy(indexCustomer, qtyFcs, invFCS, gmFCS);

    printInTableLinesCustomer(dataCustomer);
    //calcGMRoy(indexCustomer);

}

function calcGMRoy(index) {

    const indexCustomer = (index) ? index : this.customerIndex;
    var dataCustomer = {};
    Object.entries(getDataFromInputs('customerForm')).forEach(([key, value]) => {
        var keySplit = key.split('/')
        if (parseInt(keySplit[1]) == indexCustomer) {
            dataCustomer[keySplit[0]] = {'value': value, 'idInput': key};
        }
    });

    var unitPriceRoy = dataCustomer['UNIT PRICE ROY'];
    var unitCostRoy = dataCustomer['UNIT COST ROY']
    var gmPercRoyProposal = dataCustomer['GMP ROY']
    var unitMarginRoy = dataCustomer['UNIT MARGIN ROY'];
    var qtyFcs = dataCustomer['QTY FCS'];
    var gmRoy = dataCustomer['GM ROY'];
    var gmFCS = dataCustomer['GM FCS'];
    var gmYTD = dataCustomer['GM YTD'];
    var qtyRoy = dataCustomer['QTY ROY'];
    var invRoy = dataCustomer['INV ROY'];
    var invFCS = dataCustomer['INV FCS'];
    var invYTD = dataCustomer['INV YTD'];
    var gmpFCS = dataCustomer['GMP FCS']
    var costRoy = dataCustomer['COST ROY']
    var costFCS = dataCustomer['COST FCS']

    unitPriceRoy.value = (parseFloat(unitCostRoy.value) / (1 - (parseFloat(gmPercRoyProposal.value) / 100))).toString()
    unitMarginRoy.value = (parseFloat(unitPriceRoy.value) - parseFloat(unitCostRoy.value)).toString();
    gmRoy.value = (parseFloat(unitMarginRoy.value) * parseInt(qtyRoy.value)).toString();
    gmFCS.value = (parseFloat(gmRoy.value) + parseFloat(gmYTD.value)).toString();
    invRoy.value = (parseInt(qtyRoy.value) * parseFloat(unitPriceRoy.value)).toString();
    invFCS.value = (parseFloat(invRoy.value) + parseFloat(invYTD.value)).toString();
    gmpFCS.value = (parseFloat(gmFCS.value) / parseFloat(invFCS.value) * 100).toString();
    costRoy.value = (parseFloat(invRoy.value) - parseFloat(gmRoy.value)).toString();
    costFCS.value = (parseFloat(invFCS.value) - parseFloat(gmFCS.value)).toString();

    calcTotalesQtyRoy(indexCustomer, qtyFcs, invFCS, gmFCS);

    printInTableLinesCustomer(dataCustomer);

}

function calcBDG() {
    var indexCustomer = this.customerIndex;
    var dataCustomer = {};
    Object.entries(getDataFromInputs('customerForm')).forEach(([key, value]) => {
        var keySplit = key.split('/')
        if (parseInt(keySplit[1]) == indexCustomer) {
            dataCustomer[keySplit[0]] = {'value': value, 'idInput': key};
        }
    });
    if (this.thName == 'QTY BDG') {
        calcQtyBdg(dataCustomer, indexCustomer);
    } else if (this.thName == 'GMP BDG') {
        calcPercBdg(dataCustomer, indexCustomer);
    }

    printInTableLinesCustomer(dataCustomer);
}

function calcTotalesQtyBDG(indexCustomer, qtyBDG, invBDG, gmBDG) {

    var qtyBDGTotalSRTotalSR = document.getElementById('totalSR/totalSR/BDG/QTY');
    var qtyBDGcustomerTotalSR = document.getElementById('totalCustomer/totalSR/BDG/QTY');
    var qtyBDGOriginal = parseInt(dataCustomerModificada[indexCustomer]['QTY BDG']);
    var gmFCSTotalSRTotalSR = document.getElementById('totalSR/totalSR/FCS/GM');
    var gmFCSTotalCustomerTotalSR = document.getElementById('totalCustomer/totalSR/FCS/GM');


    qtyBDGTotalSRTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(qtyBDGTotalSRTotalSR.value)) - qtyBDGOriginal + parseInt(qtyBDG.value));
    qtyBDGcustomerTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(qtyBDGcustomerTotalSR.value)) - qtyBDGOriginal + parseInt(qtyBDG.value));
    dataCustomerModificada[indexCustomer]['QTY BDG'] = qtyBDG.value;

    var invBDGTotalSRTotalSR = document.getElementById('totalSR/totalSR/BDG/INV');
    var invBDGcustomerTotalSR = document.getElementById('totalCustomer/totalSR/BDG/INV');
    var invBDGOriginal = parseInt(dataCustomerModificada[indexCustomer]['INV BDG']);
    invBDGTotalSRTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(invBDGTotalSRTotalSR.value)) - invBDGOriginal + parseInt(invBDG.value));
    invBDGcustomerTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(invBDGcustomerTotalSR.value)) - invBDGOriginal + parseInt(invBDG.value));
    dataCustomerModificada[indexCustomer]['INV BDG'] = invBDG.value;

    var gmBDGTotalSRTotalSR = document.getElementById('totalSR/totalSR/BDG/GM');
    var gmBDGcustomerTotalSR = document.getElementById('totalCustomer/totalSR/BDG/GM');
    var gmBDGOriginal = parseInt(dataCustomerModificada[indexCustomer]['GM BDG']);
    gmBDGTotalSRTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(gmBDGTotalSRTotalSR.value)) - gmBDGOriginal + parseInt(gmBDG.value));
    gmBDGcustomerTotalSR.value = putThousandsMask(parseInt(removeThousandsMask(gmBDGcustomerTotalSR.value)) - gmBDGOriginal + parseInt(gmBDG.value));
    dataCustomerModificada[indexCustomer]['GM BDG'] = gmBDG.value;

    var gmpBDGTotalSRTotalSR = document.getElementById('totalSR/totalSR/BDG/GMPERC');
    var gmpBDGcustomerTotalSR = document.getElementById('totalCustomer/totalSR/BDG/GMPERC');
    var gmpBDGTotalSRTotalSRNewValue = parseInt(removeThousandsMask(gmBDGTotalSRTotalSR.value)) / parseInt(removeThousandsMask(invBDGTotalSRTotalSR.value)) * 100;
    var gmpBDGcustomerTotalSRNewValue = parseInt(removeThousandsMask(gmBDGcustomerTotalSR.value)) / parseInt(removeThousandsMask(invBDGcustomerTotalSR.value)) * 100;
    gmpBDGTotalSRTotalSR.value = (Math.round((gmpBDGTotalSRTotalSRNewValue + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',');
    gmpBDGcustomerTotalSR.value = (Math.round((gmpBDGcustomerTotalSRNewValue + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',');


    var qtyFCSTotalSRTotalSR = document.getElementById('totalSR/totalSR/FCS/QTY');
    var qtyFCSCustomerTotalTotalSR = document.getElementById('totalCustomer/totalSR/FCS/QTY');

    var varPercQtyBdgVsFcsTotalSRTotalSR = document.getElementById('totalSR/totalSR/BDG/VAR');
    var varPercQtyBdgVsFcsCustomerTotalSR = document.getElementById('totalCustomer/totalSR/BDG/VAR');

    var valueVarPerc = (((parseInt(removeThousandsMask(gmBDGTotalSRTotalSR.value)) / parseInt(removeThousandsMask(gmFCSTotalSRTotalSR.value)) - 1) * 100)).toString()
    varPercQtyBdgVsFcsTotalSRTotalSR.value = (Math.round((parseFloat(valueVarPerc) + Number.EPSILON) * 10) / 10).toString().replaceAll('.', ',')

    var valueVarPerc = (((parseInt(removeThousandsMask(gmBDGcustomerTotalSR.value)) / parseInt(removeThousandsMask(gmFCSTotalCustomerTotalSR.value)) - 1) * 100)).toString()
    varPercQtyBdgVsFcsCustomerTotalSR.value = (Math.round((parseFloat(valueVarPerc) + Number.EPSILON) * 10) / 10).toString().replaceAll('.', ',')


}

function calcQtyBdg(dataCustomer, indexCustomer) {
    var unitPriceBDG = dataCustomer['UNIT PRICE BDG'];
    var qtyBDG = dataCustomer['QTY BDG'];
    var qtyFcs = dataCustomer['QTY FCS'];
    var invBDG = dataCustomer['INV BDG'];
    var gmBDG = dataCustomer['GM BDG'];
    var varPercQtyBDGvsFcs = dataCustomer['VAR% QTY BDG vs FCS'];
    var unitMarginBDG = dataCustomer['UNIT MARGIN BDG'];
    var gmpBDG = dataCustomer['GMP BDG'];
    var costBDG = dataCustomer['COST BDG'];

    invBDG.value = (parseFloat(qtyBDG.value) * parseFloat(unitPriceBDG.value)).toString()
    varPercQtyBDGvsFcs.value = (((parseFloat(qtyBDG.value) / parseFloat(qtyFcs.value)) - 1) * 100).toString()
    gmBDG.value = (parseFloat(unitMarginBDG.value) * parseFloat(qtyBDG.value)).toString();
    gmpBDG.value = (parseFloat(gmBDG.value) / parseFloat(invBDG.value) * 100).toString();
    costBDG.value = (parseFloat(invBDG.value) - parseFloat(gmBDG.value)).toString();
    calcTotalesQtyBDG(indexCustomer, qtyBDG, invBDG, gmBDG);

}

function calcPercBdg(dataCustomer, indexCustomer) {
    var unitCostBDG = dataCustomer['UNIT COST BDG'];
    var unitPriceBDG = dataCustomer['UNIT PRICE BDG'];
    var gmpBDG = dataCustomer['GMP BDG'];
    var unitMarginBDG = dataCustomer['UNIT MARGIN BDG'];
    var gmBDG = dataCustomer['GM BDG'];
    var qtyBDG = dataCustomer['QTY BDG'];
    var invBDG = dataCustomer['INV BDG'];
    var costBDG = dataCustomer['COST BDG'];

    unitPriceBDG.value = (parseFloat(unitCostBDG.value) / (1 - (parseFloat(gmpBDG.value) / 100))).toString();
    unitMarginBDG.value = (parseFloat(unitPriceBDG.value) - parseFloat(unitCostBDG.value)).toString();
    gmBDG.value = (parseFloat(unitMarginBDG.value) * parseFloat(qtyBDG.value)).toString();
    invBDG.value = (parseFloat(qtyBDG.value) * parseFloat(unitPriceBDG.value)).toString();
    costBDG.value = (parseFloat(invBDG.value) - parseFloat(gmBDG.value)).toString();

    calcTotalesQtyBDG(indexCustomer, qtyBDG, invBDG, gmBDG);
}

function printInTableLinesCustomer(dataCustomer) {
    Object.entries(dataCustomer).forEach(([key, value]) => {
        var valueObject = '';
        if (value.idInput.includes('VAR')) {
            valueObject = (Math.round((parseFloat(value.value) + Number.EPSILON) * 10) / 10).toString().replaceAll('.', ',')
            valueObject = checkDecimals(valueObject, 'VAR');
        } else if (value.idInput.startsWith('comments')
            || value.idInput.startsWith('select')) {
            valueObject = value.value;
        } else if (key == 'UNIT PRICE ROY'
            || key == 'UNIT PRICE BDG'
            || key == 'UNIT MARGIN ROY'
            || key == 'UNIT MARGIN BDG'
        ) {
            valueObject = (Math.round((parseFloat(value.value) + Number.EPSILON) * 10000) / 10000).toString().replaceAll('.', ',')
        } else if (document.querySelector('th[name*="' + key + '"]').getAttribute('hidden') == 'true') {
            valueObject = value.value.replaceAll('.', ',');
        } else if (value.idInput.includes('%') || value.idInput.startsWith('GMP')) {
            valueObject = (Math.round((parseFloat(value.value) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',');
            valueObject = checkDecimals(valueObject, 'PERC');
        } else {
            valueObject = putThousandsMask(Math.round(value.value));
        }
        document.getElementById(value.idInput).value = valueObject;
    });
    Array.from(document.querySelectorAll('input'))
    .filter(input => input.value.includes('Infinity'))
    .forEach(input => input.value = '0,0');
    setZeroValueInputsNaN();
}


async function onSelectBusinessType() {
    var businessType = $('#select-businessType').val();
    $("#select-incomeType").find('option').remove();
    $("#select-incomeType").append('<option value="">select an option</option>');

    await loadDropDown($("#select-incomeType"), "srProcess/listIncomeTypes?UBT_LocalADUuser=" + UbT_LocalADUuser
        + "&BU_AGRUPADA=" + userLogged.bu_agrupada
        + "&BUSINESS_TYPE=" + encodeURIComponent(businessType)
        + "&CHECKED=" + checkedValue
        + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'SR'), "id", "name");

    if (document.getElementById('select-incomeType').options.length == 2) {
        await nextSelectedOption('select-incomeType');
    } else {
        await onSelectIncomeType();
    }


}

async function onSelectIncomeType() {
    var businessType = $('#select-businessType').val();
    var incomeType = $("#select-incomeType").val();

    // 1) Cargar PRINCIPAL
    await loadPrincipals();

    // 2) Cargar CUSTOMERS (filtrados por PRINCIPAL si hubiera)
    $("#select-customer").find('option').remove();
    $("#select-customer").append('<option value="">select an option</option>');

    var principal = $('#select-principal').val() || '';

    await loadDropDown($("#select-customer"), "srProcess/listCustomers?UBT_LocalADUuser=" + UbT_LocalADUuser
        + "&INCOME_TYPE=" + encodeURIComponent(incomeType || '')
        + "&BUSINESS_TYPE=" + encodeURIComponent(businessType || '')
        + "&PRINCIPAL=" + encodeURIComponent(principal)
        + "&BU_AGRUPADA=" + userLogged.bu_agrupada
        + "&CHECKED=" + checkedValue
        + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'SR')
        + "&TYPE=" + encodeURIComponent(typedChecked.toString()), "id", "name");

    Array.from(document.querySelectorAll('#buttonsCustomer button')).forEach(button => {
        button.disabled = false;
    });

    // Autoselect si aplica
    if ($('#select-customer').val() == '') {
        await nextSelectedOption('select-customer');
    }

    if ($('#select-customer').val() == '') {
        $('#divTables').hide();
        $("#saveButton").prop("disabled", true);
    }
}


async function onSelectCustomerChange() {
    var businessType = $('#select-businessType').val();
    var incomeType = $('#select-incomeType').val();
    var customer = $('#select-customer').val();
    var principal = $('#select-principal').val() || '';

    var data = await $.get({
        url: URLBACKEND + "srProcess/getCustomerLines?UBT_LocalADUuser=" + UbT_LocalADUuser
            + "&incomeType=" + encodeURIComponent(incomeType || '')
            + "&businessType=" + encodeURIComponent(businessType || '')
            + "&customer=" + customer
            + "&principal=" + encodeURIComponent(principal)     // <-- NUEVO
            + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'SR')
            + "&CHECKED=" + checkedValue
            + "&TYPE=" + encodeURIComponent(typedChecked.toString()),
        type: 'Get'
    });
    //JSON.parse para evitar que se modifique el objeto dataCustomerOriginal
    dataCustomerOriginal = JSON.parse(JSON.stringify(data));
    dataCustomerModificada = JSON.parse(JSON.stringify(data));
    await getValuesForTotales('totalSR', customer);
    await getValuesForTotales('totalCustomer', customer);
    if (esPM || esSR) {
        getQTYRoyData(data)
        getGMPercRoyData(data);
        await getTableBDGData(data);
        $('#divTables').show();
        $("#saveButton").prop("disabled", false);
    } else {
        $('#divTables').hide();
    }

    Array.from(document.querySelectorAll('input[editable="true"]')).forEach(input => {
        input.readOnly = false;
        input.classList.add('editable');
    });

    var customerText = document.getElementById('customerText');
    customerText.innerText = "Total Customer: " + $("#select-customer option:selected").text();
    arrayInputsOrdenados = Array.from(document.querySelectorAll('input.editable')).sort((a, b) => {
        var idA = parseInt(a.id.split('/')[1]);
        var idB = parseInt(b.id.split('/')[1]);

        return idA - idB;
    });
    updateSelectedOption('select-customer');
}


function validateForm() {
    var requiredValuesBool = requiredValues();
    var valuesCorrect = checkCorrectValue();
    return {
        requiredValues: {valid: requiredValuesBool, message: 'YELLOW_FIELDS_WAR'},
        valuesCorrect: {valid: valuesCorrect, message: 'ERR_INPUTS_VALUE_ZERO'}
    };
}

//function that checks if any value in the inputs has the value "-"
function checkCorrectValue() {
    var valuesCorrect = true;
    var inputs = Array.from(document.querySelectorAll('input.editable'));
    inputs.forEach(input => {
        if (input.value == '-') {
            valuesCorrect = false;
            input.classList.add('errorValue');
        } else {
            input.classList.remove('errorValue');
        }
    });
    return valuesCorrect;
}


function requiredValues() {
    var valoresRequeridosContestados = true;
    requiredFields.forEach(field => {
        var select = document.getElementById(field.id);
        //Check if selected option is greater than the first option in the select element
        if (select.selectedIndex == 0) {
            valoresRequeridosContestados = false;
        }
    });
    return valoresRequeridosContestados;
}

async function save() {
    var formValidation = validateForm();

    if (!formValidation.requiredValues.valid || !formValidation.valuesCorrect.valid) {
        if (!formValidation.valuesCorrect.valid) {
            getAlertMessage(formValidation.valuesCorrect.message);
        }
        if (!formValidation.requiredValues.valid) {
            getAlertMessage(formValidation.requiredValues.message);
        }
    } else {
        isCambiosRealizados = false;
        var formDataFiltros = new FormData(document.getElementById('formFiltros'));

        formDataFiltros.append('UBT_LocalADUuser', userLogged.UbT_LocalADUuser);

        var arrayObjects = [];

        var trs = Array.from(document.querySelectorAll('#divTables tr[index]'))
        var objectsLength = parseInt(trs.hasMax('index').getAttribute('index'));

        for (var i = 0; i <= objectsLength; i++) {
            var trsObject = trs.filter(tr => parseInt(tr.getAttribute('index')) == i);
            var object = {};
            trsObject.forEach(tr => {
                var divs = Array.from(tr.querySelectorAll('div:not(.empty)'));
                if (divs.length > 0) {
                    divs.forEach(div => {
                        var key = div.id.split('/')[0]

                        object[key] = div.innerText;
                    });
                }
                var comments = tr.querySelector('select');
                if (comments != undefined) {
                    object['COMMENTS'] = comments.value;
                }
                var inputs = Array.from(tr.querySelectorAll('input'));
                if (inputs.length > 0) {
                    inputs.forEach(input => {
                        var key = input.id.split('/')[0]
                        key = key.replaceAll(' ', '_');
                        key = key.replace('%', 'PERC');
                        object[key] = (removeThousandsMask(input.value)).toString().replaceAll(',', '.');
                    });
                }
            });
            arrayObjects.push(object);
        }
        var items = [];

        for (let [key, val] of formDataFiltros.entries()) {
            if (key == 'customer' || key == 'UBT_LocalADUuser') {
                let isNumeric = $.isNumeric(parseInt(removeThousandsMask(val)));
                items.push({[key]: (key.includes('PERC')) ? val.toString().replaceAll(',', '.') : (isNumeric) ? (removeThousandsMask(val)).toString().replaceAll(',', '.') : val});
            }
        }

        items.push({'LINES': arrayObjects});

        await $.post(URLBACKEND + "srProcess/saveLines", "items=" + encodeURIComponent(JSON.stringify(items)));
        getAlertMessage('SAVE_SUC');
        clean();

    }
}

async function clean(e) {
    if (e)
        e.preventDefault();
    requiredFields = [];
    await loadDropDown($("#select-businessType"), "srProcess/listBusinessTypes?UBT_LocalADUuser=" + UbT_LocalADUuser
        + "&BU_AGRUPADA=" + userLogged.bu_agrupada
        + "&CHECKED=" + checkedValue
        + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'SR'), "id", "name");
    await getActualStatus();
    var totalSRText = document.getElementById('totalSRText');

    totalSRText.innerText = "Total SR: " + capitalizeFirstLetterString(userLogged.UBT_UserName);
    await onSelectBusinessType();
    //nextSelectedOption('select-businessType');
    //updateSelectedOption('select-customer');
    Array.from(document.querySelectorAll('#divTables table')).forEach(table => {
        $('#' + table.id + ' tbody').empty();
    });

    blockInputs();
}


function blockInputs() {
    Array.from(document.querySelectorAll('#divTables table input')).forEach(input => {
        input.value = 0;
        input.readOnly = true;
        input.classList.remove('editable');
        input.classList.remove('errorValue');
    });
}

function finalizeSrProcess(e) {
    e.preventDefault();

    var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;

    $.get({
        url: URLBACKEND + "srProcess/getActualStatus?UBT_LocalADUuser=" + UbT_LocalADUuser
            + "&BU_AGRUPADA=" + userLogged.bu_agrupada
            + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'SR'),
        type: 'Get'
    }).then(data => {
        var totalFinished = 0;
        var totalCustomers = 0;
        data.forEach(type => {
            if (type.checked > 0) {
                totalFinished += parseInt(type.checked);
            }
            totalCustomers += parseInt(type.total);
        });
        if (totalFinished != totalCustomers) {
            getAlertMessage('ERR_CUSTOMERS_LEFT');
        } else {
            $.post(URLBACKEND + "utils/ActivityLog_Insert", 'LocalAdUser=' + userLogged.UbT_LocalADUuser + '&TaskName=SR_LOG_INSERT&Status=DONE')
                .then(data => {
                    processFinalized = true;
                    $("#saveButton").prop("disabled", true);
                    blockInputs();
                    $('#divLogSRProcess').hide();
                    getAlertMessage('FINALIZED_PROCESS_SUC');
                });
        }
    });
}

function downloadExcelSr() {
    var reportName = esBUM ? "Sr_ProcessReport_BUM" : (esMM ? "Sr_ProcessReport_MM" : "Sr_ProcessReport");
    var principal = $('#select-principal').val() || '';
    window.open(
        URLBACKEND + "/report/downloadExcel"
        + "?REPORT_NAME=" + reportName
        + "&LocalADUser=" + userLogged.UbT_LocalADUuser
        + "&BUAGRUPADA=" + userLogged.bu_agrupada
        + "&PRINCIPAL=" + encodeURIComponent(principal),    // <-- NUEVO
        "_blank"
    );
}


function checkCambiosRealizados() {
    var inputs = Array.from(document.querySelectorAll('input.editable'));
    isCambiosRealizados = false;
    inputs.forEach(input => {
        if (removeThousandsMask(input.value).replaceAll(',', '.') != dataCustomerOriginal[input.id]) {
            isCambiosRealizados = true;
        }
    })
}

function getDataFromInputs(formId) {
    var arrayInputs = Array.from(document.querySelectorAll("#" + formId + " input")).map((input) => ({[input.id]: input.value}));
    var dataInputs = {};
    arrayInputs.forEach(input => {
        Object.entries(input).forEach(([key, value]) => {
            dataInputs[key] = removeThousandsMask(value).replaceAll(',', '.');
        });
    });

    return dataInputs;

}

function parseData(data, formId) {
    var tables = Array.from(document.querySelectorAll('#' + formId + ' table'));
    var valuesByTable = [];
    tables.forEach(table => {
        valuesByTable.push({'table': table.getAttribute('name'), 'headers': []});
    });

    Object.entries(data).forEach(([key, value]) => {
        valuesByTable.forEach(obj => {
            if (key.includes(obj.table)) {
                var keyParsed = key.split('/')[2]
                if (!obj.headers.some(header => header.headerName == keyParsed)) {
                    var header = {'headerName': keyParsed, 'values': []};
                    header.values.push({'name': key.split('/')[3], 'value': value, 'idInput': key})
                    obj.headers.push(header);

                } else {
                    var header = obj.headers.find(header => header.headerName == keyParsed)
                    header.values.push({'name': key.split('/')[3], 'value': value, 'idInput': key});
                }

            }
        })
    });

    return valuesByTable;
}