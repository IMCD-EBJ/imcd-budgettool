var editar = false;
var processFinalized = false;

var selectOldValue;
var repLineDataOriginal;
var repLineDataOriginalModificada;
var principalDataOriginal;
var principalDataOriginalModificada;


$(document).ready(function () {
    $body = $("body");
    initUserRolesSafe();

    var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
    loadDropDown($("#select-company"), "utils/listCompanyByUser?UbT_LocalADUuser=" + UbT_LocalADUuser, "id", "name")
    itemsSeleccionadosTableSelected = new Array();
    var saveButton = document.getElementById('saveButton');
    saveButton.onclick = function (event) {
        event.preventDefault();
        save();
    }
    var headersHorizontal = [
        ['YTD', 'L12', 'Lyr'],
        ['ROY Lyr', 'Mgment Proposal', 'PM Proposal'],
        ['FCS', 'Mgment Proposal', 'PM Proposal']
    ]
    var tablesRepLine = Array.from(document.querySelectorAll('#reportLineForm table'));
    var tablesPrincipal = Array.from(document.querySelectorAll('#principalForm table'));

    tablesRepLine.forEach((table, index) => {
        table.append(createTbodyTable('REP_LINE', table.id, table, headersHorizontal[index]));
    });

    tablesPrincipal.forEach((table, index) => {
        table.append(createTbodyTable('PRINC', table.id, table, headersHorizontal[index]));
    });

    var bum = localStorage.getItem('activeRol') == 'BUM';
    var mm = localStorage.getItem('activeRol') == 'MM';
    if (bum || mm) {
        $('#commentsForm').hide();
        $('#divLogPMProcess').hide();
        $('#productsLost').hide();
    }
    $.get({
        url: URLBACKEND + "utils/ActivityLog_Consult?LocalAdUser=" + userLogged.UbT_LocalADUuser + '&taskName=PM_LOG_INSERT',
        type: 'Get'
    }).then(data => {
        if (parseInt(data.logExists) > 0) {
            processFinalized = true;
            $("#saveButton").prop("disabled", true);
            $("#btn-selectItems").prop("disabled", true);
            $("#btn-unselectItems").prop("disabled", true);
            $("#saveIndividualLostProducts").prop("disabled", true);
            $("#saveRepLineLostProducts").prop("disabled", true);
            $("#select-month").prop("disabled", true);
            $("#comments-lostProduct").prop("disabled", true);

            blockInputs();
            $('#divLogPMProcess').hide();
        }
    });

    Array.from(document.querySelectorAll('#formCompanyPrincipal select')).forEach(select => {
        select.onfocus = function (event) {
            selectOldValue = event.target.value;
        }
    });
});


async function getActualStatus() {
    var company = $("#select-company").val();
    var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
    var bu_agrupada = userLogged.bu_agrupada;

    if (company !== "") {
        $.get({
            url: URLBACKEND + "pmProcess/getActualStatus?COU_ID=" + company
                + "&BU_AGRUPADA=" + bu_agrupada
                + "&UBT_LocalADUuser=" + UbT_LocalADUuser
                + "&ROL=" + ((esBUM) ? "BUM" : (esMM) ? "MM" : 'PM'),
            type: 'Get'
        }).then(data => {
            if (esBUM || esMM) {
                generateActualStatusForBUM(data);
            } else {
                generateActualStatusForPM(data);
            }
        });
    }
}

async function selectCompany_Change(event) {
    if (isCambiosRealizados) {
        getAlertMessage("UNSAVED_CHANGES_WAR", async function (isConfirm) {
            if (isConfirm) {
                isCambiosRealizados = false;
                await changeCompany();
            } else {
                event.target.value = selectOldValue;
            }
        });
    } else {
        await changeCompany()
    }
}

async function changeCompany() {
    $("#select-principal").find('option').remove();
    $("#select-principal").append('<option value="">select an option</option>');

    await selectPrincipal_Change();
    var company = $("#select-company").val();
    if (company !== "") {

        var checkedValue = (document.getElementById('checked').checked) ? "1" : "0";
        var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
        await loadDropDown($("#select-principal"), "pmProcess/listPrincipal?COU_ID=" + company
            + "&BU_AGRUPADA=" + userLogged.bu_agrupada
            + "&UBT_LocalADUuser=" + UbT_LocalADUuser
            + "&checked=" + checkedValue
            + "&ROL=" + ((esBUM) ? "BUM" : ((esMM) ? "MM" : "PM")), "id", "name");
        await getActualStatus();
        await nextSelectedOption('select-principal');
    }
    updateSelectedOption('select-principal');
}

function generateActualStatusForPM(data) {
    var totalFinished = 0;
    var actualStatusBody = document.getElementById('actualStatusBody');
    $('#actualStatusBody').empty();
    data.forEach(principal => {
        if (principal.checked == principal.totalReportingline) {
            totalFinished++;
        }
        var div = document.createElement('div');

        div.className = 'actualStatusElement';
        var divInner = document.createElement('div');
        divInner.classList.add('row');
        var divName = document.createElement('div');
        divName.classList.add('col-md-6');
        var text = document.createTextNode(principal.name);
        divName.appendChild(text);
        divInner.appendChild(divName);

        var divQuantity = document.createElement('div');
        divQuantity.classList.add('col-md-6');
        var text = document.createTextNode(principal.checked + '/' + principal.totalReportingline + ' \tReporting Lines');
        divQuantity.appendChild(text);
        divInner.appendChild(divQuantity);
        div.appendChild(divInner);
        actualStatusBody.appendChild(div);
    });
    $('#actualStatus').show();
    $('#recordsReported').empty();
    $('#recordsReported').append('Actual Status: ' + totalFinished + '/' + data.length + ' Principals Done');
}

function generateActualStatusForBUM(data) {
    var totalPrincipals = 0;
    var totalPrincipalsFinished = 0;
    var actualStatusBody = document.getElementById('actualStatusBody');
    $('#actualStatusBody').empty();
    data.forEach(pm => {
        var div = document.createElement('div');

        div.className = 'actualStatusElement';
        var divInner = document.createElement('div');
        divInner.classList.add('row');
        var divName = document.createElement('div');
        divName.classList.add('col-md-6');
        var pmFinished = false;
        var totalPrincipalsPM = 0;

        var totalFinished = 0;
        var text = document.createTextNode(capitalizeFirstLetterString(pm.pmName));
        divName.appendChild(text);
        divInner.appendChild(divName);
        pm.principals.forEach(principal => {
            if (principal.checked == principal.totalReportingline && principal.totalReportingline > 0) {
                totalFinished++;
                totalPrincipalsFinished++;
            }
        });
        totalPrincipals += pm.principals.length;
        var divQuantity = document.createElement('div');
        divQuantity.classList.add('col-md-6');
        var text = document.createTextNode(totalFinished + '/' + pm.principals.length + ' Principals Done');
        divQuantity.appendChild(text);
        divInner.appendChild(divQuantity);
        div.appendChild(divInner);
        actualStatusBody.appendChild(div);
    });
    $('#actualStatus').show();
    $('#recordsReported').empty();
    $('#recordsReported').append('Actual Status BU: ' + totalPrincipalsFinished + '/' + totalPrincipals + ' Principals Done');
}


async function selectPrincipal_Change(event) {
    if (isCambiosRealizados) {
        getAlertMessage("UNSAVED_CHANGES_WAR", async function (isConfirm) {
            if (isConfirm) {
                isCambiosRealizados = false;
                await changeSelectPrincipal();
            } else {
                event.target.value = selectOldValue;
            }
        });
    } else {
        await changeSelectPrincipal()
    }
}

async function changeSelectPrincipal() {
    var principal = $("#select-principal").val();
    var company = $("#select-company").val();
    $("#select-principalRepLine").find('option').remove();
    $("#select-principalRepLine").append('<option value="">select an option</option>');

    if (principal !== "") {
        var checkedValue = (document.getElementById('checked').checked) ? "1" : "0";
        var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
        await loadDropDown($("#select-principalRepLine"),
            "pmProcess/listPrincipalReportingLine?COU_ID=" + company
            + "&BU_AGRUPADA=" + userLogged.bu_agrupada
            + "&UBT_LocalADUuser=" + UbT_LocalADUuser
            + "&PRINCIPAL_ERP_NUMBER=" + principal
            + "&checked=" + checkedValue
            + "&ROL=" + ((esBUM) ? "BUM" : ((esMM) ? "MM" : "PM")), "name", "name");

        Array.from(document.querySelectorAll('#reportLineForm table input')).forEach(input => {
            input.value = 0;
            input.readOnly = true;
            input.classList.remove('editable');
            input.classList.remove('errorValue');
        });


        $('#principalText').empty();
        if (principal != '') {
            if (esBUM) {
                $('#principalText').append('Full Principal: ' + $("#select-principal option:selected").text())
            } else {
                $('#principalText').append('Principal: ' + $("#select-principal option:selected").text())
            }
        } else {
            $('#principalText').append('Principal: ')
        }
        await nextSelectedOption('select-principalRepLine');

        //getPrincipalRepLineGroupedByPrincipal();


    }
    updateSelectedOption('select-principal');
    updateSelectedOption('select-principalRepLine');
}

async function getPrincipalRepLineGroupedByPrincipal() {
    var principal = $("#select-principal").val();
    var company = $("#select-company").val();
    var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;

    var data = await $.get({
        url: URLBACKEND + "pmProcess/consultPrincipalReportingLineGroupedByPrincipal?COU_ID=" + company
            + "&BU_AGRUPADA=" + userLogged.bu_agrupada
            + "&UBT_LocalADUuser=" + UbT_LocalADUuser
            + "&PRINCIPAL_ERP_NUMBER=" + principal
            + "&ROL=" + ((esBUM) ? "BUM" : ((esMM) ? "MM" : "PM")),
        type: 'Get'
    })

    var dataUpdated = parseData(data, 'principalForm');
    calcPercentages(dataUpdated);
    calcVarQty(dataUpdated);
    printInTable(dataUpdated);
    principalDataOriginal = getDataFromInputs('principalForm');
    principalDataOriginalModificada = getDataFromInputs('principalForm');
}

async function selectPrincipalRepLine_Change(event) {
    if (isCambiosRealizados) {
        getAlertMessage("UNSAVED_CHANGES_WAR", async function (isConfirm) {
            if (isConfirm) {
                isCambiosRealizados = false;
                await changeSelectPrincipalRepLine();
            } else {
                event.target.value = selectOldValue;
            }
        });
    } else {
        await changeSelectPrincipalRepLine()
    }
}

async function changeSelectPrincipalRepLine() {
    $('#repLineText').empty();
    var repLineVal = $("#select-principalRepLine").val();

    if (repLineVal != '') {
        $('#repLineText').append('Reporting Line: ' + $("#select-principalRepLine option:selected").text())
    } else {
        $('#repLineText').append('Reporting Line: ');
    }

    var principal = $("#select-principal").val();
    var company = $("#select-company").val();
    var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
    var reportingLine = $('#select-principalRepLine').val();

    updateSelectedOption('select-principalRepLine');

    var data = await $.get({
        url: URLBACKEND + "pmProcess/consultPrincipalReportingLine?COU_ID=" + company
            + "&BU_AGRUPADA=" + userLogged.bu_agrupada
            + "&UBT_LocalADUuser=" + UbT_LocalADUuser
            + "&PRINCIPAL_ERP_NUMBER=" + principal
            + "&REPORTING_LINE=" + encodeURIComponent(reportingLine)
            + "&ROL=" + ((esBUM) ? "BUM" : ((esMM) ? "MM" : "PM")),
        type: 'Get'
    });

    var dataUpdated = parseData(data, 'reportLineForm');

    if (esPM) {
        if (!processFinalized) {
            Array.from(document.querySelectorAll('input[editable]')).forEach(input => {
                input.readOnly = false;
                input.classList.add('editable');
            });
        }
        // calcInvAndGMForPM(data['ROY_UNIT_COST'], dataUpdated, 'Roy');
        // calcInvAndGMForPM(data['ROY_UNIT_COST'], dataUpdated, 'BDG');
        loadLostProducts()
    }

    calcBdgFCS(dataUpdated);
    calcPercentages(dataUpdated);
    calcVarQty(dataUpdated);

    printInTable(dataUpdated);
    await getPrincipalRepLineGroupedByPrincipal();

    $('#ROY_UNIT_COST').val(data['ROY_UNIT_COST']);

    $('#select-month').val(data['select-month']);
    $('#comments-lostProduct').val(data['comments-lostProduct']);
    repLineDataOriginal = getDataFromInputs('reportLineForm');
    repLineDataOriginalModificada = getDataFromInputs('reportLineForm');
    arrayInputsOrdenados = Array.from(document.querySelectorAll('input.editable'));
}

function printInTable(dataUpdated) {
    dataUpdated.forEach(table => {
        table.headers.forEach(header => {
            header.values.forEach(input => {
                var value = '';
                if (input.idInput.includes('VAR')) {
                    value = (Math.round((parseFloat(input.value) + Number.EPSILON) * 10) / 10).toString().replaceAll('.', ',');
                    value = checkDecimals(value, 'VAR');
                } else if ((input.idInput.includes('PERC'))) {
                    value = (Math.round((parseFloat(input.value) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',');
                    value = checkDecimals(value, 'PERC');
                } else if (input.idInput.startsWith('comments') || input.idInput.startsWith('select')) {
                    value = input.value;
                } else {
                    value = putThousandsMask(Math.round(input.value));
                }
                document.getElementById(input.idInput).setAttribute('decimalvalue', input.value.replaceAll('.', ','));
                document.getElementById(input.idInput).value = value;
            });
        });
    });
}



//DE MOMENTO NO APLICADO POR ERROR DE CONSISTENCIA EN DATOS
function readjustmentFCSPrincipal(dataUpdatedRepLine, dataUpdatedPrincipal) {
    var fcs = dataUpdatedRepLine.find(obj => obj.table == 'BDG').headers.find(header => header.headerName == 'FCS');
    var fcsPrinc = dataUpdatedPrincipal.find(objPrinc => objPrinc.table == 'BDG').headers.find(headerPrinc => headerPrinc.headerName == 'FCS');

    var qty = fcs.values.find(input => input.idInput.includes('QTY'));
    var perc = fcs.values.find(input => input.idInput.includes('GMPERC'));
    var inv = fcs.values.find(input => input.idInput.includes('INV'));
    var gm = fcs.values.find(input => input.idInput.endsWith('GM'));

    var qtyPrinc = fcsPrinc.values.find(input => input.idInput.includes('QTY'));
    var percPrinc = fcsPrinc.values.find(input => input.idInput.includes('GMPERC'));
    var invPrinc = fcsPrinc.values.find(input => input.idInput.includes('INV'));
    var gmPrinc = fcsPrinc.values.find(input => input.idInput.endsWith('GM'));

    qtyPrinc.value = parseInt(removeThousandsMask(qtyPrinc.value)) + (parseInt(removeThousandsMask(qty.value)) - parseInt(removeThousandsMask(qtyPrinc.value)))
    invPrinc.value = parseInt(removeThousandsMask(invPrinc.value)) + (parseInt(removeThousandsMask(inv.value)) - parseInt(removeThousandsMask(invPrinc.value)))
    var gmValueCalculado = parseInt(parseFloat(percPrinc.value.replaceAll(',', '.')) * parseInt(removeThousandsMask(invPrinc.value)) / 100);
    gmPrinc.value = gmValueCalculado
}

async function checked_Change(event) {
    if (isCambiosRealizados) {
        getAlertMessage("UNSAVED_CHANGES_WAR", async function (isConfirm) {
            if (isConfirm) {
                isCambiosRealizados = false;
                var company = $("#select-company").val();
                if (company !== "") {
                    clean()
                } else {
                    event.target.checked = false;
                }
            } else {
                event.target.checked = !event.target.checked;
            }
        });
    } else {
        var company = $("#select-company").val();
        if (company !== "") {
            clean()
        } else {
            event.target.checked = false;
        }
    }

}

function createTbodyTable(nameBlock, nameTable, table, headersHorizontal) {
    var tbody = document.createElement('tbody');
    var thArray = Array.from(table.querySelectorAll('th')).filter(th =>
        th.getAttribute('name') != null && th.getAttribute('colspan') == null
    ).map((th) =>
        ({name: th.getAttribute('name'), editable: th.getAttribute('editable')})
    );
    headersHorizontal.forEach(headerHorizontal => {
        tbody.appendChild(createTrTbody(nameBlock, nameTable, headerHorizontal, thArray, table.getAttribute('name')));
    });
    return tbody;
}

function createTrTbody(nameBlock, nameTable, headerHorizontal, thArray, tableType) {
    var tr = document.createElement('tr');
    var thHorizontal = document.createElement('th');
    thHorizontal.classList.add('headerHorizontal');
    var divThHorizontal = document.createElement('div');
    divThHorizontal.classList.add('mt-2');
    divThHorizontal.appendChild(document.createTextNode(headerHorizontal));
    thHorizontal.appendChild(divThHorizontal);
    tr.appendChild(thHorizontal);

    thArray.forEach(th => {
        if (headerHorizontal != 'ROY Lyr' && headerHorizontal != 'Lyr' || th.name != 'VARPERC') {
            tr.appendChild(createInput(nameBlock, headerHorizontal, nameTable, th.name, th.editable, tableType));
        }
    });
    return tr;
}

function createInput(nameBlock, headerHorizontal, nameTable, inputName, editable, tableType) {
    var td = document.createElement('td');
    var input = document.createElement('input');
    input.name = nameBlock + '/' + headerHorizontal + '/' + nameTable + '/' + inputName;
    input.id = nameBlock + '/' + headerHorizontal + '/' + nameTable + '/' + inputName;
    input.className = "form-control text-center ";
    input.setAttribute('type', 'text');

    input.value = 0;
    input.setAttribute('readonly', 'true');
    if (headerHorizontal == 'PM Proposal' && (nameTable == 'tableRepLineBDG' || nameTable == 'tableRepLineRoy') && inputName == 'QTY') {
        input.setAttribute('pattern', "^-?\\d+$/");
        input.setAttribute('onkeypress', 'isIntegerKey(event,this)');
        input.setAttribute('editable', 'true');
        input.onchange = function () {
            checkCambiosRealizados()
            if (input.value == '') {
                input.value = 0;
            }
            if (input.value.indexOf(",") > 0) {
                if (input.value.split(',')[1].length >= 2) {
                    input.value = (Math.round((parseFloat(input.value.replaceAll(',', '.')) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',')
                }
            }

            calcInvGMPMProposal(tableType);
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
        }
    } else if (headerHorizontal == 'PM Proposal' && (nameTable == 'tableRepLineBDG' || nameTable == 'tableRepLineRoy') && inputName == 'GMPERC') {
        input.setAttribute('editable', 'true');
        input.setAttribute('onkeypress', 'isDecimalPercentKey(event,this)');
        input.setAttribute('pattern', "^([0-9]\\d?|100)(\\.\\d{1,2})?$");
        input.onchange = function () {

            checkCambiosRealizados()
            if (input.value == '') {
                input.value = 0;
            }
            if (input.value.indexOf(",") > 0) {
                if (input.value.split(',')[1].length >= 2) {
                    input.value = (Math.round((parseFloat(input.value.replaceAll(',', '.')) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',')
                }
            }
            calcInvGMPMProposal(tableType);
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
            input.value = checkDecimals(input.value, 'PERC');
        }
    }
    td.appendChild(input);
    return td;
}

function checkCambiosRealizados() {
    var inputs = Array.from(document.querySelectorAll('input.editable'));
    isCambiosRealizados = false;
    inputs.forEach(input => {
        if (removeThousandsMask(input.value).replaceAll(',', '.') != repLineDataOriginal[input.id]) {
            isCambiosRealizados = true;
        }
    })
}

function calcInvAndGMForPM(royUnitCost, dataReportLine, table) {
    var GMPM = dataReportLine.find(obj => obj.table == table).headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'GM');
    var QtyPM = dataReportLine.find(obj => obj.table == table).headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'QTY');
    var InvPM = dataReportLine.find(obj => obj.table == table).headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'INV');
    var PercPM = dataReportLine.find(obj => obj.table == table).headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'GMPERC');

    if (parseFloat(PercPM.value) == 100) {
        PercPM.value = '99.99';
    }
    var royUnitInv = parseFloat(royUnitCost) / (1 - (parseFloat(PercPM.value) / 100));
    InvPM.value = (parseFloat(QtyPM.value) * royUnitInv).toString();
    GMPM.value = (parseFloat(PercPM.value) / 100 * parseFloat(InvPM.value)).toString();
}

function calcBdgFCS(dataReportLine) {

    var royQtyYTD = dataReportLine.find(obj => obj.table == "HistData").headers.find(header => header.headerName == 'YTD').values.find(input => input.name == 'QTY');
    var royInvYTD = dataReportLine.find(obj => obj.table == "HistData").headers.find(header => header.headerName == 'YTD').values.find(input => input.name == 'INV');
    var royGMYTD = dataReportLine.find(obj => obj.table == "HistData").headers.find(header => header.headerName == 'YTD').values.find(input => input.name == 'GM');

    var royQtyPM = dataReportLine.find(obj => obj.table == "Roy").headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'QTY');
    var royInvPM = dataReportLine.find(obj => obj.table == "Roy").headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'INV');
    var royGMPM = dataReportLine.find(obj => obj.table == "Roy").headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'GM');

    var royQtyFCS = dataReportLine.find(obj => obj.table == "BDG").headers.find(header => header.headerName == 'FCS').values.find(input => input.name == 'QTY');
    var royInvFCS = dataReportLine.find(obj => obj.table == "BDG").headers.find(header => header.headerName == 'FCS').values.find(input => input.name == 'INV');
    var royGMFCS = dataReportLine.find(obj => obj.table == "BDG").headers.find(header => header.headerName == 'FCS').values.find(input => input.name == 'GM');

    royQtyFCS.value = (parseFloat(royQtyYTD.value) + parseFloat(royQtyPM.value)).toString();
    royInvFCS.value = (parseFloat(royInvYTD.value) + parseFloat(royInvPM.value)).toString();
    royGMFCS.value = (parseFloat(royGMYTD.value) + parseFloat(royGMPM.value)).toString();
}


function calcInvGMPMProposal(tableType) {
    var dataUpdatedRepLine = parseData(getDataFromInputs('reportLineForm'), 'reportLineForm');

    calcInvAndGMForPM($('#ROY_UNIT_COST').val(), dataUpdatedRepLine, 'Roy');
    calcInvAndGMForPM($('#ROY_UNIT_COST').val(), dataUpdatedRepLine, 'BDG');
    calcBdgFCS(dataUpdatedRepLine);
    calcPercentages(dataUpdatedRepLine);
    calcVarQty(dataUpdatedRepLine);

    printInTable(dataUpdatedRepLine);

    var dataUpdatedPrincipal = parseData(getDataFromInputs('principalForm'), 'principalForm');
    updateValuesDeAgregados(dataUpdatedRepLine, dataUpdatedPrincipal);
    calcPercentages(dataUpdatedPrincipal);
    calcVarQty(dataUpdatedPrincipal);

    printInTable(dataUpdatedPrincipal);

}

function updateValuesDeAgregados(dataUpdatedRepLine, dataUpdatedPrincipal) {
    dataUpdatedRepLine.forEach(obj => {
        obj.headers.forEach(header => {
            var qty = header.values.find(input => input.idInput.includes('QTY'));
            var perc = header.values.find(input => input.idInput.includes('GMPERC'));
            var inv = header.values.find(input => input.idInput.includes('INV'));
            var gm = header.values.find(input => input.idInput.endsWith('GM'));

            var qtyPrinc = dataUpdatedPrincipal.find(objPrinc => objPrinc.table == obj.table)
                .headers.find(headerPrinc => headerPrinc.headerName == header.headerName)
                .values.find(input => input.name == 'QTY');
            var percPrinc = dataUpdatedPrincipal.find(objPrinc => objPrinc.table == obj.table)
                .headers.find(headerPrinc => headerPrinc.headerName == header.headerName)
                .values.find(input => input.name == 'GMPERC');
            var invPrinc = dataUpdatedPrincipal.find(objPrinc => objPrinc.table == obj.table)
                .headers.find(headerPrinc => headerPrinc.headerName == header.headerName)
                .values.find(input => input.name == 'INV');
            var gmPrinc = dataUpdatedPrincipal.find(objPrinc => objPrinc.table == obj.table)
                .headers.find(headerPrinc => headerPrinc.headerName == header.headerName)
                .values.find(input => input.name == 'GM');

            var qtyValueOriginal = repLineDataOriginalModificada[qty.idInput];
            qtyPrinc.value = (parseFloat(qtyPrinc.value) - parseFloat(qtyValueOriginal) + parseFloat(qty.value)).toString();
            repLineDataOriginalModificada[qty.idInput] = qty.value;

            var invValueOriginal = repLineDataOriginalModificada[inv.idInput];
            invPrinc.value = (parseFloat(invPrinc.value) - parseFloat(invValueOriginal) + parseFloat(inv.value)).toString();
            repLineDataOriginalModificada[inv.idInput] = inv.value;

            var gmValueOriginal = repLineDataOriginalModificada[gm.idInput];
            //var gmValueCalculado = parseFloat(parseFloat(perc.value.replaceAll(',', '.')) * parseFloat(removeThousandsMask(inv.value)) / 100);
            //gm.value = gmValueCalculado;
            gmPrinc.value = (parseFloat(gmPrinc.value) - parseFloat(gmValueOriginal) + parseFloat(gm.value)).toString();
            repLineDataOriginalModificada[gm.idInput] = gm.value;
        });
    });
}

async function save() {
    isCambiosRealizados = false;
    var formDataRepLine = new FormData(document.getElementById('reportLineForm'));

    formDataRepLine.append('COMPANY', $('#select-company').val());
    formDataRepLine.append('PRINCIPAL_ERP_NUMBER', $('#select-principal').val());
    formDataRepLine.append('PRINCIPAL_REPORTING_LINE', encodeURIComponent($('#select-principalRepLine').val()));
    formDataRepLine.append('BU_AGRUPADA', userLogged.bu_agrupada);
    formDataRepLine.append('UBT_LocalADUuser', userLogged.UbT_LocalADUuser);
    //formDataRepLine.append('Comments', $('#Comments').val()) &

    var items = [];

    for (let [key, val] of formDataRepLine.entries()) {
        if (!key.includes('HistData')) {
            let isNumeric = $.isNumeric(parseInt(removeThousandsMask(val)));
            var item;
            if (key.includes('PERC')) {
                 item = {[key] :val.toString().replaceAll(',', '.')};
            }else if (key == 'ROY_UNIT_COST') {
                item = {[key] :val.toString().replaceAll(',', '.')};
            }else if(isNumeric){
                item = {[key] :removeThousandsMask(val)};
            }else {
                item = {[key] :val};
            }
            items.push(item);
        }
    }
    var productsOk = await saveProductsLost({"id": "savesaveIndividualLostProducts"});
    if (productsOk) {
        await $.post(URLBACKEND + "pmProcess/saveReportingLine", "items=" + JSON.stringify(items));
        getAlertMessage('SAVE_SUC');
        selectOldValue = $('#select-principal').val();
        await clean();
    }
//    var principalExists = Array.from(document.querySelectorAll('#select-principal option')).some(option => option.value == selectOldValue);
//
//    if (principalExists){
//        $('#select-principal').val(selectOldValue);
//        await changeSelectPrincipal();
//    }
}

async function clean(e) {
    if (e)
        e.preventDefault();

    await selectCompany_Change();
    updateSelectedOption('select-principalRepLine');

    blockInputs();
}


function blockInputs() {
    Array.from(document.querySelectorAll('#reportLineForm table input')).forEach(input => {
        input.value = 0;
        input.readOnly = true;
        input.classList.remove('editable');
        input.classList.remove('errorValue');
    });
    Array.from(document.querySelectorAll('#principalForm table input')).forEach(input => {
        input.value = 0;
        input.readOnly = true;
        input.classList.remove('editable');
        input.classList.remove('errorValue');
    });
}

async function finalizePMProcess(e) {
    e.preventDefault();
    var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
    var bu_agrupada = userLogged.bu_agrupada;


    var countries = Array.from(document.querySelectorAll('#select-company option')).filter(option => option.value != '');
    var sePuedeFinalizar = true;
    for await (country of countries) {
        var data = await $.get({
            url: URLBACKEND + "pmProcess/getActualStatus?COU_ID=" + country.value
                + "&BU_AGRUPADA=" + bu_agrupada
                + "&UBT_LocalADUuser=" + UbT_LocalADUuser
                + "&ROL=" + ((esBUM) ? "BUM" : "PM"),
            type: 'Get'
        });
        var totalFinished = 0;
        if (esPM){
            data.forEach(principal => {
                if (principal.checked == principal.totalReportingline) {
                    totalFinished++;
                }
            });
            if (totalFinished != data.length) {
                sePuedeFinalizar = false;
            }
        }else{
            data.forEach(pm  => {
                totalFinished = 0;
                pm.principals.forEach(principal => {
                    if (principal.checked == principal.totalReportingline) {
                        totalFinished++;
                    }
                });
                if (totalFinished != pm.principals.length) {
                    sePuedeFinalizar = false;
                }
            });
        }
    }
    if (!sePuedeFinalizar) {
        getAlertMessage('ERR_PRINCIPALS_LEFT');
    } else {
        $.post(URLBACKEND + "utils/ActivityLog_Insert", 'LocalAdUser=' + userLogged.UbT_LocalADUuser + '&TaskName=PM_LOG_INSERT&Status=DONE')
            .then(data => {
                processFinalized = true;
                $("#saveButton").prop("disabled", true);
                $("#btn-selectItems").prop("disabled", true);
                $("#btn-unselectItems").prop("disabled", true);
                $("#saveIndividualLostProducts").prop("disabled", true);
                $("#saveRepLineLostProducts").prop("disabled", true);
                $("#select-month").prop("disabled", true);
                $("#comments-lostProduct").prop("disabled", true);

                blockInputs();
                $('#divLogPMProcess').hide();
                getAlertMessage('FINALIZED_PROCESS_SUC');
            });
    }
}


function calcPercentages(valuesByTable) {
    valuesByTable.forEach(obj => {
        obj.headers.forEach(header => {
            var gm = header.values.find(input => input.name == 'GM');
            var inv = header.values.find(input => input.name == 'INV');
            var gmperc = header.values.find(input => input.name == 'GMPERC');
            var inputEditable = document.getElementById(gmperc.idInput).classList.contains('editable');
            if (!inputEditable)
                gmperc.value = (parseInt(inv.value) > 0) ? (Math.round((parseFloat(parseFloat(parseFloat(gm.value) / parseFloat(inv.value) * 100).toString()) + Number.EPSILON) * 100) / 100).toString() : '0';
        });
    });
}


function calcVarQty(valuesByTable) {
    var royQtyPM = valuesByTable.find(obj => obj.table == 'Roy').headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'QTY');
    var royQtyLyr = valuesByTable.find(obj => obj.table == 'Roy').headers.find(header => header.headerName == 'ROY Lyr').values.find(input => input.name == 'QTY');
    var royVarPM = valuesByTable.find(obj => obj.table == 'Roy').headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'VARPERC');
    if (royQtyPM.value > 0 && royQtyLyr.value > 0) {
        royVarPM.value = parseFloat((((parseFloat(royQtyPM.value) / parseFloat(royQtyLyr.value)) - 1) * 100)).toString();
    } else if (royQtyPM.value == 0) {
        royVarPM.value = '-100'
    }

    var bdgQtyPM = valuesByTable.find(obj => obj.table == 'BDG').headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'QTY');
    var bdgQtyFCS = valuesByTable.find(obj => obj.table == 'BDG').headers.find(header => header.headerName == 'FCS').values.find(input => input.name == 'QTY');
    var bdgVarPM = valuesByTable.find(obj => obj.table == 'BDG').headers.find(header => header.headerName == 'PM Proposal').values.find(input => input.name == 'VARPERC');
    if (bdgQtyPM.value > 0 && bdgQtyFCS.value > 0) {
        bdgVarPM.value = parseFloat((((parseFloat(bdgQtyPM.value) / parseFloat(bdgQtyFCS.value)) - 1) * 100)).toString();
    } else if (bdgQtyPM.value == 0) {
        bdgVarPM.value = '-100'
    }


    var histDataQtyLyr = valuesByTable.find(obj => obj.table == 'HistData').headers.find(header => header.headerName == 'Lyr').values.find(input => input.name == 'QTY');
    var bdgVarFCS = valuesByTable.find(obj => obj.table == 'BDG').headers.find(header => header.headerName == 'FCS').values.find(input => input.name == 'VARPERC');
    if (histDataQtyLyr.value > 0 && bdgQtyFCS.value > 0) {
        bdgVarFCS.value = parseFloat((((parseFloat(bdgQtyFCS.value) / parseFloat(histDataQtyLyr.value)) - 1) * 100)).toString();
    } else if (bdgQtyFCS.value == 0) {
        bdgVarFCS.value = '-100'
    }
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
                var keyParsed = key.split('/')[1]
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


function getDataFromInputs(formId) {
    var arrayInputs = Array.from(document.querySelectorAll("#" + formId + " input")).map((input) => ({[input.id]: input.value}));
    var arrayInputsParsed = [];
    arrayInputs.forEach(input => {
        Object.entries(input).forEach(([key, value]) => {
            if (key != 'ROY_UNIT_COST' && key != 'ROY_UNIT_INV') {
                if (!key.includes('PERC')) {
                    var decimalvalue = document.getElementById(key).getAttribute('decimalvalue');
                    var splitDecimalValue;
                    if (decimalvalue != null && decimalvalue != undefined && decimalvalue != '') {
                        splitDecimalValue = decimalvalue.split(',');
                    } else {
                        splitDecimalValue = decimalvalue.split('.');
                    }

                    if (splitDecimalValue.length > 1) {
                        var esEditable = document.getElementById(key).getAttribute('editable');
                        var inputParsed;

                        if (esEditable == 'true') {
                            inputParsed = {[key]: removeThousandsMask(value)};
                        } else {
                            inputParsed = {[key]: decimalvalue};
                        }
                        arrayInputsParsed.push(inputParsed);
                    } else {
                        arrayInputsParsed.push({[key]: value});
                    }
                } else {
                    arrayInputsParsed.push({[key]: value});
                }
            }
        });
    });

    var dataInputs = {};
    arrayInputsParsed.forEach(input => {
        Object.entries(input).forEach(([key, value]) => {
            if (key.includes('PERC')) {
                dataInputs[key] = value.replaceAll(',', '.');
            } else {
                var temp = removeThousandsMask(value);
                dataInputs[key] = temp.replaceAll(',', '.');
            }

        });
    });

    return dataInputs;

}

function downloadExcelPm() {

    var reportName;

    if (esBUM){
        reportName = "Pm_ProcessReport_BUM";
    } else if(esPM){
        reportName = "Pm_ProcessReport";
    }

    window.open(URLBACKEND + "/report/downloadExcel?REPORT_NAME="+reportName+"&LocalADUser=" + userLogged.UbT_LocalADUuser + "&BUAGRUPADA=" + userLogged.bu_agrupada,
        "_blank");
}

function initUserRolesSafe() {
    // Si no existen, se consideran false
    if (typeof esPM === 'undefined') {
        window.esPM = false;
    }
    if (typeof esBUM === 'undefined') {
        window.esBUM = false;
    }
    if (typeof esMM === 'undefined') {
        window.esMM = false;
    }

    // Si existe activeRol en localStorage, se usa como fuente
    var activeRol = localStorage.getItem('activeRol');

    if (activeRol === 'PM') {
        window.esPM = true;
    } else if (activeRol === 'BUM') {
        window.esBUM = true;
    } else if (activeRol === 'MM') {
        window.esMM = true;
    }
}
