var editar = false;
var processFinalized = false;
var actualizacionesDoneRoy = []
var actualizacionesDoneBdg = []
$(document).ready(function () {
    var permisosPermitidos = ['BUM', 'ADMIN'];
    var tienePermiso = userLogged.Profiles.some(i => permisosPermitidos.includes(i));

    if (!tienePermiso) {
        location.href = 'index.html';
    } else {

        var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
        var saveButton = document.getElementById('saveButton');
        saveButton.onclick = function (event) {
            event.preventDefault();
            save();
        }

        Array.from($('#tradeNameForm input')).forEach(input => {
            if (input.id != 'GM_ROY' && input.id != 'GM_BDG') {

                input.readOnly = true;
                input.classList.remove('editable');
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
                    event.target.onchange(event);
                }
            }
        });
        $.get({
            url: URLBACKEND + "utils/ActivityLog_Consult?LocalAdUser=" + userLogged.UbT_LocalADUuser+'&taskName=BUM_LOG_INSERT',
            type: 'Get'
        }).then(data => {
            loadDropDown($("#select-company"), "utils/listCompanyByUser?UbT_LocalADUuser=" + UbT_LocalADUuser, "id", "name")
            if (parseInt(data.logExists) > 0) {
                processFinalized = true;

                $("#select-principal").prop("disabled", true);
                $("#tradeNameForm :input").prop("disabled", true);
                $("#customerAreaForm input").prop("disabled", true);
                $("#saveButton").prop("disabled", true);
                $("#automaticDistributionButton").prop("disabled", true);
                $('#divLogBumProcess').hide();
            }
        });
    }
});


async function selectCompany_Change() {
    $("#select-principal").find('option').remove();
    $("#select-principal").append('<option value="">select an option</option>');
    document.getElementById('tradeNameForm').reset();
    var company = $("#select-company").val();
    if (company !== "") {

        await loadDropDown($("#select-principal"), "bumProcess/listPrincipals?company=" + company + "&buAgrupada=" + userLogged.bu_agrupada + "&UBT_LocalADUuser=" + userLogged.UbT_LocalADUuser, "id", "name")
        if(processFinalized){
           $("#select-principal").prop("disabled", true);
        }
        $("#select-bumTradename").find('option').remove();
        await loadDropDown($("#select-bumTradename"), "bumProcess/listBumTradeNameReported?COU_ID=" + company + "&BU_AGRUPADA=" + userLogged.bu_agrupada, "id", "name");
        $('#recordsReported').empty();
        $('#recordsReported').append('<small>' + 'Actual Status: ' + ($("#select-bumTradename").find('option').length - 1) + ' Record Reported' + '</small>');
        var UbT_LocalADUuser = userLogged.UbT_LocalADUuser;
        getCostumerAreas(UbT_LocalADUuser, company);
    }
}

function calcPercentGmRoy(event) {
    if (event) {
        if (event.target.value == '') {
            event.target.value = 0;
        }
    }

    var invroy = removeThousandsMask($("#INV_ROY").val());
    var porroy = removeThousandsMask($("#GM_ROYPERC").val());

    if ((invroy != null && invroy != '') && (porroy != null && porroy != ''))
        $("#GM_ROY").val(putThousandsMask(Math.round(parseFloat(invroy) * (parseFloat(porroy) / 100))));
    Array.from(document.querySelectorAll('[id^="ROY_PERC_CA"]')).forEach(input => input.onchange());
}

function calcPercentGmBdg(event) {
    if (event) {
        if (event.target.value == '') {
            event.target.value = 0;
        }
    }
    var invbdg = removeThousandsMask($("#INV_BDG").val());
    var porbdg = removeThousandsMask($("#GM_BDGPERC").val());

    if ((invbdg != null && invbdg != '') && (porbdg != null && porbdg != ''))
        $("#GM_BDG").val(putThousandsMask(Math.round(parseFloat(invbdg) * (parseFloat(porbdg) / 100))));
    Array.from(document.querySelectorAll('[id^="BDG_PERC_CA"]')).forEach(input => input.onchange());
}

function selectTradeName_Change() {
    editar = !processFinalized;

    if(editar){
        Array.from($('#tradeNameForm input')).forEach(input => {
            if (input.id != 'GM_ROY' && input.id != 'GM_BDG') {
                input.readOnly = false;
                input.classList.add('editable');
                input.onchange();
                input.value = 0;
            }
        });

        Array.from(document.querySelectorAll('[id^="BDG_PERC_CA"]')).forEach(input => {
            input.readOnly = false;
            input.classList.add('editable');
            input.value = 0;
        });

        Array.from(document.querySelectorAll('[id^="ROY_PERC_CA"]')).forEach(input => {
            input.readOnly = false;
            input.classList.add('editable');
            input.value = 0;
        });
    }
    arrayInputsOrdenados = Array.from(document.querySelectorAll('input.editable'));
}

async function selectPrincipal_Change() {
    $("#select-tradeName").find('option').remove();
    $("#select-tradeName").append('<option value="">select an option</option>');

    var principal = $("#select-principal").val();
    var company = $("#select-company").val();
    if (principal !== "")
        if(!processFinalized)
            await loadDropDown($("#select-tradeName"), "utils/listProductTradeName?principal=" + Math.round(parseInt(principal)) + "&COU_Id=" + company + "&BU_AGRUPADA=" + userLogged.bu_agrupada, "id", "name");
}


function getCostumerAreas(UBT_LocalADUuser, cou_id) {
    $.get({
        url: URLBACKEND + "bumProcess/listCustomerArea?UBT_LocalADUuser=" + UBT_LocalADUuser + "&COU_Id=" + cou_id,
        type: 'Get'
    }).then(data => {
        actualizacionesDoneRoy = [];
        actualizacionesDoneBdg = [];
        var customerAreaDiv = document.getElementById('customerAreas');
        $("#customerAreas").empty();

        var tablePercentages = document.querySelector('#tablePercentage');
        var tablePercentagesTbody = tablePercentages.querySelector('tbody');
        $("#tablePercentage tbody tr").remove()

        var tableRoyPercent = document.querySelector('#tableRoyPercent');
        var tableRoyPercentTbody = tableRoyPercent.querySelector('tbody');
        $("#tableRoyPercent tbody tr").remove()

        var tableBdgPercent = document.querySelector('#tableBdgPercent');
        var tableBdgPercentTbody = tableBdgPercent.querySelector('tbody');
        $("#tableBdgPercent tbody tr").remove()

        var tableRoy = document.querySelector('#tableRoy');
        var tableRoyInputs = Array.from(tableBdgPercent.querySelectorAll('input'));

        data.forEach((customerArea, index) => {
            var div = document.createElement('div');

            if (index == 0) {
                div.style = "margin-top: 1.75em!important;"
            }
            div.className = 'customerArea';

            var text = document.createTextNode(customerArea.name);
            div.appendChild(text);
            customerAreaDiv.appendChild(div);
            var inputName = customerArea.name;
            var trPercentages = createTrForTable(tablePercentages, inputName);
            tablePercentagesTbody.appendChild(trPercentages);

            var trRoyPercent = createTrForTable(tableRoyPercent, inputName);
            tableRoyPercentTbody.appendChild(trRoyPercent);

            var trBdgPercent = createTrForTable(tableBdgPercent, inputName);
            tableBdgPercentTbody.appendChild(trBdgPercent);

        });
    });
}


function createTrForTable(table, inputName) {
    var tr = document.createElement('tr');
    var thArray = Array.from(table.querySelectorAll('th'));
    thArray.forEach(th => {
        var td = document.createElement('td');
        var input = document.createElement('input');
        var editable = th.getAttribute('editable');
        input.setAttribute('type', 'text');
        input.className = "form-control text-center ";
        input.name = th.getAttribute('name') + inputName;
        input.id = th.getAttribute('name') + inputName;
        input.setAttribute('pattern', "^-?\\d+$/");
        input.setAttribute('onkeypress', 'isIntegerKey(event,this)');
        input.value = 0;
        input.setAttribute('readonly', 'true');
        if (th.getAttribute('name') == 'ROY_PERC_CA/') {
            input.setAttribute('onkeypress', 'isDecimalPercentKey(event,this)');
            input.setAttribute('pattern', "^([0-9]\\d?|100)(\\.\\d{1,2})?$");
            actualizacionesDoneRoy.push({ 'customerArea': inputName, 'actualizado': false });
            input.onchange = function (e) {
                if (input.value == '') {
                    input.value = 0;
                }
                if (input.value.indexOf(",") > 0) {
                    if (input.value.split(',')[1].length >= 2) {
                        input.value = (Math.round((parseFloat(input.value.replaceAll(',', '.')) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',');
                    }
                }

                automaticDistributionForRecalculation('ROY');
                ejecutarAdjustRoyValues = true;
                actualizacionesDoneRoy.forEach(object => {
                    if (!object.actualizado) ejecutarAdjustRoyValues = false;
                })
                var totalRoyInput = document.getElementById('TOTAL_ROY');
                if (ejecutarAdjustRoyValues && parseFloat(totalRoyInput.value) == 100)
                    adjustValues('ROY');
            };
            input.onfocus = function (event) {
                if (event.target.value == '0') {
                    event.target.value = '';
                }
                actualInput = arrayInputsOrdenados.indexOf(event.target);
                event.target.select();
            }
            input.onfocusout = function (event) {
                event.target.onchange(event);
            }
        } else if (th.getAttribute('name') == 'BDG_PERC_CA/') {
            input.setAttribute('onkeypress', 'isDecimalPercentKey(event,this)');
            input.setAttribute('pattern', "^([0-9]\\d?|100)(\\.\\d{1,2})?$");
            actualizacionesDoneBdg.push({ 'customerArea': inputName, 'actualizado': false });
            input.onchange = function (e) {
                if (input.value == '') {
                    input.value = 0;
                }
                if (input.value.indexOf(",") > 0) {
                    if (input.value.split(',')[1].length >= 2) {
                        input.value = (Math.round((parseFloat(input.value.replaceAll(',', '.')) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',')
                    }
                }
                automaticDistributionForRecalculation('BDG');
                ejecutarAdjustBdgValues = true;
                actualizacionesDoneBdg.forEach(object => {
                    if (!object.actualizado) ejecutarAdjustBdgValues = false;
                })
                var totalBdgInput = document.getElementById('TOTAL_BUDGET');
                if (ejecutarAdjustBdgValues && parseFloat(totalBdgInput.value) == 100)
                    adjustValues('BDG');
            };
            input.onfocus = function (event) {
                if (event.target.value == '0') {
                    event.target.value = '';
                }
                actualInput = arrayInputsOrdenados.indexOf(event.target);
                event.target.select();
            }
            input.onfocusout = function (event) {
                event.target.onchange(event);
            }
        }
        td.appendChild(input);
        tr.appendChild(td);
    });
    return tr;
}


async function selectbumTrade_Change() {
    var productFullSegmentNumber = $('#select-bumTradename').val();
    var data = await $.get({
        url: URLBACKEND + "bumProcess/getBumTradeNameReported?productFullSegmentNumber=" + productFullSegmentNumber + "&BU_AGRUPADA=" + userLogged.bu_agrupada + "&COU_ID=" + $('#select-company').val(),
        type: 'Get'
    });
    data['select-principal'] = Math.round(parseInt(data['select-principal'])).toString();
    var selectTradeName = document.getElementById('select-tradeName');
    $("#select-tradeName").find('option').remove();
    $("#select-tradeName").append('<option value="' + productFullSegmentNumber + '">' + $("#select-bumTradename option:selected").text() + '</option>');
    $('#select-tradeName').val(productFullSegmentNumber);
    selectTradeName.disabled = true;
    editar = !processFinalized;
    var object = { 'ACTION': 'update', 'COU_Id': $('#select-company').val(), 'PRINCIPAL_ERP_NUMBER': data['select-principal'], 'PRODUCT_FULL_SEGMENT_NUMBER': $('#select-bumTradename').val() }

    if(editar){
        Array.from($('#tradeNameForm input')).forEach(input => {
            if (input.id != 'GM_ROY' && input.id != 'GM_BDG') {
                input.readOnly = false;
                input.classList.add('editable');
            }
        });

        Array.from(document.querySelectorAll('[id^="BDG_PERC_CA"]')).forEach(input => {

            input.readOnly = false;
            input.classList.add('editable');
        });

        Array.from(document.querySelectorAll('[id^="ROY_PERC_CA"]')).forEach(input => {
            input.readOnly = false;
            input.classList.add('editable');
        });
    }
    Object.entries(data).forEach(([key, value]) => {
        $('#' + key).val((key.includes('PERC') ? Math.round((parseFloat(value) + Number.EPSILON) * 100) / 100 : (key == 'Comments' || key == 'select-principal') ? value : putThousandsMask(Math.round(value))));
    });
    if (!processFinalized){
        var company = document.getElementById('select-company');
        company.disabled = true;
        var selectPrincipal = document.getElementById('select-principal');
        selectPrincipal.disabled = true;
    }

    await getBumCustomerAreaReported(object);
    calcularTotales();
    var saveButton = document.getElementById('saveButton');
    saveButton.onclick = function (event) {
        event.preventDefault();
        save(object);
    }
    arrayInputsOrdenados = Array.from(document.querySelectorAll('input.editable'));
}


async function getBumCustomerAreaReported(params) {
    var data = await $.get({
        url: URLBACKEND + "bumProcess/getBumCustomerAreaReported?COU_ID="
            + params.COU_Id + "&principal="
            + params.PRINCIPAL_ERP_NUMBER
            + "&productFullSegmentNumber=" + params.PRODUCT_FULL_SEGMENT_NUMBER
            + "&buAgrupada=" + userLogged.bu_agrupada,
        type: 'Get'
    });

    data.forEach(customerArea => {
        var alphaName = customerArea.ALPHA_NAME;
        Object.entries(customerArea).forEach(([key, value]) => {
            if (key != 'ALPHA_NAME') {
                document.getElementById(key + '/' + alphaName).value = (key.includes('PERC') ? (Math.round((parseFloat(value) + Number.EPSILON) * 100) / 100).toString().replaceAll('.', ',') : putThousandsMask(Math.round(value)));
            }
        });

    });

    calcularTotales();
}

function changeRoyPercCA(customerArea) {
    var QTY_ROY = removeThousandsMask($('#QTY_ROY').val());
    var INV_ROY = removeThousandsMask($('#INV_ROY').val());
    var GM_ROYPERC = $('#GM_ROYPERC').val();
    var GM_ROY = removeThousandsMask($('#GM_ROY').val());

    var royPercCA = document.getElementById('ROY_PERC_CA/' + customerArea).value.replaceAll(',', '.');
    document.getElementById('QTY_ROY_CA/' + customerArea).value = putThousandsMask(Math.round(parseFloat(royPercCA) * parseFloat(QTY_ROY) / 100));
    document.getElementById('INV_ROY_CA/' + customerArea).value = putThousandsMask((Math.round(parseFloat(royPercCA) * parseFloat(INV_ROY) / 100)));
    document.getElementById('GM_ROYPERC_CA/' + customerArea).value = (royPercCA == 0) ? 0 : GM_ROYPERC;
    document.getElementById('GM_ROY_CA/' + customerArea).value = putThousandsMask((Math.round(parseFloat(royPercCA) * parseFloat(GM_ROY) / 100)));
    actualizacionesDoneRoy.find(obj => obj.customerArea == customerArea).actualizado = true;
    calcularTotales();
}

function changeBdgPercCA(customerArea) {
    var QTY_BDG = removeThousandsMask($('#QTY_BDG').val());
    var INV_BDG = removeThousandsMask($('#INV_BDG').val());
    var GM_BDGPERC = $('#GM_BDGPERC').val();
    var GM_BDG = removeThousandsMask($('#GM_BDG').val());

    var bdgPercCA = document.getElementById('BDG_PERC_CA/' + customerArea).value.replaceAll(',', '.');
    document.getElementById('QTY_BDG_CA/' + customerArea).value = putThousandsMask((Math.round(parseFloat(bdgPercCA) * parseFloat(QTY_BDG) / 100)));
    document.getElementById('INV_BDG_CA/' + customerArea).value = putThousandsMask(Math.round(parseFloat(bdgPercCA) * parseFloat(INV_BDG) / 100));
    document.getElementById('GM_BDGPERC_CA/' + customerArea).value = (bdgPercCA == 0) ? 0 : GM_BDGPERC;
    document.getElementById('GM_BDG_CA/' + customerArea).value = putThousandsMask((Math.round(parseFloat(bdgPercCA) * parseFloat(GM_BDG) / 100)));
    actualizacionesDoneBdg.find(obj => obj.customerArea == customerArea).actualizado = true;
    calcularTotales()
}

function adjustValues(table) {
    var tablePercentInputs = Array.from(document.querySelectorAll('[id^="' + table + '_PERC_CA"]')).filter(input => input.value != "0");

    let mapValues = {
        'qtyRoy': { 'inputValue': removeThousandsMask($('#QTY_' + table).val()), 'currValues': Array.from(document.querySelectorAll('[id^="QTY_' + table + '_CA"]')).filter(input => input.value != "0") },
        'invRoy': { 'inputValue': removeThousandsMask($('#INV_' + table).val()), 'currValues': Array.from(document.querySelectorAll('[id^="INV_' + table + '_CA"]')).filter(input => input.value != "0") },
        'gmRoy': { 'inputValue': removeThousandsMask($('#GM_' + table).val()), 'currValues': Array.from(document.querySelectorAll('[id^="GM_' + table + '_CA"]')).filter(input => input.value != "0") }
    }
    let arrayValoresRedondeados;
    Object.entries(mapValues).forEach(([key, value], index) => {
        if (value.currValues.length > 0) {
            let sum = 0;
            value.currValues.forEach(input => sum += parseInt(removeThousandsMask(input.value)));
            let arrayDecimals = [];
            value.currValues.forEach(input => {
                arrayDecimals.push({ 'id': input.id, 'value': 0 });
            })
            tablePercentInputs.forEach((inputPercent, index) => {
                arrayDecimals[index].value = Math.round((((parseFloat(inputPercent.value.replaceAll(',', '.')) * parseFloat(removeThousandsMask(value.inputValue)) / 100) + Number.EPSILON)) * 100) / 100;
            });

            arrayValoresRedondeados = arrayDecimals.map(obj => { return { 'id': obj.id, 'value': Math.round(obj.value) } });
            if (sum > value.inputValue) {
                sum = 0;
                while (sum != parseInt(value.inputValue)) {
                    sum = 0;
                    let min = 0;

                    Object.entries(arrayDecimals).forEach(([keyCustomer, valueDecimal]) => {

                        if (sum != parseInt(value.inputValue)) {
                            sum = 0;
                            let minValue = arrayDecimals.hasMin('value');
                            let valueArrString = minValue.value.toString().split('.');
                            let valorDecimal = arrayDecimals.find(obj => obj.id == minValue.id);
                            arrayDecimals.splice(arrayDecimals.indexOf(valorDecimal), 1);
                            let valorRedondeado = arrayValoresRedondeados.find(obj => obj.id == minValue.id);
                            valorRedondeado.value -= 1;
                            arrayValoresRedondeados.forEach(obj => {
                                sum += obj.value;
                            })
                        }
                    });
                }

            } else if (sum < value.inputValue) {
                sum = 0;
                while (sum != parseInt(value.inputValue)) {
                    sum = 0;
                    let min = 0;
                    Object.entries(arrayDecimals).forEach(([keyCustomer, valueDecimal]) => {
                        if (sum != value.inputValue) {
                            sum = 0;
                            let maxValue = arrayDecimals.hasMax('value');
                            let valueArrString = maxValue.value.toString().split('.');
                            let valorDecimal = arrayDecimals.find(obj => obj.id == maxValue.id);
                            arrayDecimals.splice(arrayDecimals.indexOf(valorDecimal), 1);
                            let valorRedondeado = arrayValoresRedondeados.find(obj => obj.id == maxValue.id);
                            valorRedondeado.value += 1;

                            arrayValoresRedondeados.forEach(obj => {
                                sum += obj.value;
                            })
                        }
                    });
                }
            }
            arrayValoresRedondeados.forEach(obj => {
                document.getElementById(obj.id).value = putThousandsMask(obj.value);
            });
        }
    });
}


function calcularTotales() {

    var tableBdgInputs = Array.from(document.querySelectorAll('[id^="BDG_PERC_CA"]'));
    var totalBdgInput = document.getElementById('TOTAL_BUDGET');
    var totalBdgValue = 0
    tableBdgInputs.forEach(input => {
        totalBdgValue += parseFloat(input.value.replaceAll(',', '.'));
    });
    totalBdgInput.value = Math.round((totalBdgValue + Number.EPSILON) * 100) / 100;

    var tableRoyInputs = Array.from(document.querySelectorAll('[id^="ROY_PERC_CA"]'));
    var totalRoyInput = document.getElementById('TOTAL_ROY');
    var totalRoyValue = 0
    tableRoyInputs.forEach(input => {
        totalRoyValue += parseFloat(input.value.replaceAll(',', '.'));
    });

    totalRoyInput.value = Math.round((totalRoyValue + Number.EPSILON) * 100) / 100;;
}

async function save(object) {
    if(editar){
        var validationObject = validation();
        if (!validationObject.valid) {
            getAlertMessage(validationObject.errorMessage);
        } else {

            var formDataTradename = new FormData(document.getElementById('tradeNameForm'));
            var formDataCustomerArea = new FormData(document.getElementById('customerAreaForm'));

            if (object != undefined) {
                Object.entries(object).forEach(([key, value]) => {
                    formDataTradename.append(key, value);
                    formDataCustomerArea.append(key, value);
                });
            } else {
                formDataTradename.append('ACTION', 'insert');
                formDataTradename.append('COU_Id', $('#select-company').val());
                formDataTradename.append('PRINCIPAL_ERP_NUMBER', $('#select-principal').val());

                formDataCustomerArea.append('COU_Id', $('#select-company').val());
                formDataCustomerArea.append('PRODUCT_FULL_SEGMENT_NUMBER', $('#select-tradeName').val());
                formDataCustomerArea.append('PRINCIPAL_ERP_NUMBER', $('#select-principal').val());

            }
            formDataTradename.append('UBT_LocalADUuser', userLogged.UbT_LocalADUuser);
            formDataTradename.append('Comments', $('#Comments').val())
            formDataCustomerArea.append('UBT_LocalADUuser', userLogged.UbT_LocalADUuser);
            formDataCustomerArea.append('Comments', $('#Comments').val())
            var tradeNameParams = '';
            var index = 0;
            for (let [key, val] of formDataTradename.entries()) {
                val = val.toString().replaceAll(',', '.');
                let isNumeric = $.isNumeric(parseInt(removeThousandsMask(val)));
                tradeNameParams += (index == 0 ? '' : '&') + key + '=';
                tradeNameParams += (isNumeric) ? removeThousandsMask(val) : val;
                index++;
            }

            var items = [];

            for (let [key, val] of formDataCustomerArea.entries()) {
                let isNumeric = $.isNumeric(parseInt(removeThousandsMask(val)));
                items.push({ [key]: (key.includes('PERC')) ? val.toString().replaceAll(',', '.') : (isNumeric) ? removeThousandsMask(val) : val });
            }

            await $.post(URLBACKEND + "bumProcess/saveBumTradeArea", tradeNameParams);
            await $.post(URLBACKEND + "bumProcess/saveCustomerArea", "items=" + encodeURIComponent(JSON.stringify(items)));
            getAlertMessage('SAVE_SUC');
            clean();
        }
    }
}

function validation() {
    var totalBdgInput = document.getElementById('TOTAL_BUDGET');
    var totalRoyInput = document.getElementById('TOTAL_ROY');

    var validationObject = { 'valid': true };
    var valuesInformedRoy = false;
    Array.from($('#tableRoy input')).forEach(input => {
        if (parseInt(removeThousandsMask(input.value)) != 0) {
            valuesInformedRoy = true;
        }
    });

    if (valuesInformedRoy) {
        Array.from($('#tableRoy input')).forEach(input => {
            if (parseInt(removeThousandsMask(input.value)) == 0) {
                input.classList.remove('editable');
                input.classList.add('errorValue');
                validationObject['valid'] = false;
            } else {
                input.classList.remove('editable');
                input.classList.remove('errorValue');
                input.classList.add('editable');
            }
        });
    }

    var valuesInformedBdg = false;
    Array.from($('#tableBdg input')).forEach(input => {
        if (parseInt(removeThousandsMask(input.value)) != 0) {
            valuesInformedBdg = true;
        }
    });

    if (valuesInformedBdg) {
        Array.from($('#tableBdg input')).forEach(input => {
            if (parseInt(removeThousandsMask(input.value)) == 0) {
                input.classList.remove('editable');
                input.classList.add('errorValue');
                validationObject['valid'] = false;
            } else {
                input.classList.remove('editable');
                input.classList.remove('errorValue');
                input.classList.add('editable');
            }
        });
    }

    let company = $('#select-company').val();
    let principal = $('#select-principal').val();
    let tradeName = $('#select-tradeName').val();

    if (!valuesInformedBdg && !valuesInformedRoy) {
        Array.from($('#tradeNameForm input')).forEach(input => {
            input.classList.remove('editable');
            input.classList.add('errorValue');
        });
        validationObject['valid'] = false;
        validationObject['errorMessage'] = 'ERR_INPUTS_VALUE_ZERO';
    } else if (!validationObject.valid) {
        validationObject['errorMessage'] = 'ERR_INPUTS_VALUE_ZERO';
    } else if (parseFloat(totalBdgInput.value) != 100 || parseFloat(totalRoyInput.value) != 100) {

        if (parseFloat(totalBdgInput.value) != 100) {
            totalBdgInput.classList.add('errorValue')
        } else {
            totalBdgInput.classList.remove('errorValue')
        }
        if (parseFloat(totalRoyInput.value) != 100) {
            totalRoyInput.classList.add('errorValue');
        } else {
            totalRoyInput.classList.remove('errorValue');
        }

        validationObject['valid'] = false;
        validationObject['errorMessage'] = 'ERR_TOTAL_BUM_CUSTOMER_AREA';
    } else if (company == '' || principal == '' || tradeName == '') {
        validationObject['valid'] = false;
        validationObject['errorMessage'] = (tradeName == '') ? 'ERR_TRADENAME_EMPTY' : (principal == '') ? 'ERR_PRINCIPAL_EMPTY' : 'ERR_COMPANY_EMPTY';
    }

    return validationObject;
}

function automaticDistribution(e) {
    e.preventDefault();
    if (editar) {
        var tableBdgInputs = Array.from(document.querySelectorAll('[id^="BDG_PERC_CA"]'));
        var tableRoyInputs = Array.from(document.querySelectorAll('[id^="ROY_PERC_CA"]'));
        var inputsLength = tableRoyInputs.length;

        var percent = Math.round(((100 / tableBdgInputs.length) + Number.EPSILON) * 100) / 100;

        tableBdgInputs.forEach(input => input.value = percent);
        tableRoyInputs.forEach(input => input.value = percent);
        var totalBdgValue = 0
        tableBdgInputs.forEach(input => {
            totalBdgValue += parseFloat(input.value);
        });

        if (totalBdgValue < parseFloat(100)) {
            var rest = parseFloat(100 - totalBdgValue);
            tableBdgInputs[0].value = parseFloat(parseFloat(tableBdgInputs[0].value) + rest);
        } else if (totalBdgValue > parseFloat(100)) {
            var rest = parseFloat(totalBdgValue - 100);
            tableBdgInputs[0].value = parseFloat(parseFloat(tableBdgInputs[0].value) - rest);
        }

        var totalRoyValue = 0
        tableRoyInputs.forEach(input => {
            totalRoyValue += parseFloat(input.value);
        });
        if (totalRoyValue < parseFloat(100)) {
            var rest = parseFloat(100 - totalRoyValue);
            tableRoyInputs[0].value = parseFloat(parseFloat(tableRoyInputs[0].value) + rest);
        } else if (totalRoyValue > parseFloat(100)) {
            var rest = parseFloat(totalRoyValue - 100);
            tableRoyInputs[0].value = parseFloat(parseFloat(tableRoyInputs[0].value) - rest);
        }

        tableBdgInputs.forEach(input => input.value = input.value.toString().replaceAll('.', ','));
        tableRoyInputs.forEach(input => input.value = input.value.toString().replaceAll('.', ','));
        Array.from(document.querySelectorAll('[id^="ROY_PERC_CA"]')).forEach(input => input.onchange());
        Array.from(document.querySelectorAll('[id^="BDG_PERC_CA"]')).forEach(input => input.onchange());
        calcularTotales();
    }
}


function automaticDistributionForRecalculation(table) {
    if (table == 'ROY') {
        Array.from(document.querySelectorAll('[id^="ROY_PERC_CA"]')).forEach(input => {
            changeRoyPercCA(input.id.split('/')[1]);
        })
    } else {
        Array.from(document.querySelectorAll('[id^="BDG_PERC_CA"]')).forEach(input => {
            changeBdgPercCA(input.id.split('/')[1]);
        })
    }
    Array.from(document.querySelectorAll('[id^="ROY_PERC_CA"]')).forEach(input => input.value = input.value.toString().replaceAll('.', ','));
    Array.from(document.querySelectorAll('[id^="BDG_PERC_CA"]')).forEach(input => input.value = input.value.toString().replaceAll('.', ','));

    calcularTotales();
}

function cleanInputs() {
    Array.from(document.querySelectorAll('#tablePercentage input')).forEach(input => input.value = '0');
    Array.from(document.querySelectorAll('#tableRoyPercent input')).forEach(input => input.value = '0');
    Array.from(document.querySelectorAll('#tableBdgPercent input')).forEach(input => input.value = '0');
}

async function clean(e) {
    if (e)
        e.preventDefault();
    var company = document.getElementById('select-company');
    company.disabled = false;
    if(!processFinalized){
        var selectPrincipal = document.getElementById('select-principal');
        selectPrincipal.disabled = false;
        var selectTradeName = document.getElementById('select-tradeName');
        selectTradeName.disabled = false;
    }
    document.getElementById('tradeNameForm').reset();
    editar = !processFinalized;
    saveButton.onclick = function (event) {
        event.preventDefault();
        save();
    }
    await selectCompany_Change();
    await selectPrincipal_Change();
    cleanInputs();

    Array.from($('#tradeNameForm input')).forEach(input => {
        if (input.id != 'GM_ROY' && input.id != 'GM_BDG') {
            input.readOnly = true;
            input.classList.remove('editable');
            input.classList.remove('errorValue');
        }
    });

    document.getElementById('TOTAL_BUDGET').classList.remove('errorValue');
    document.getElementById('TOTAL_ROY').classList.remove('errorValue');

    $('#Comments').val('');
    calcularTotales()
}


function finalizeBumProcess(e) {
    e.preventDefault();

    $.post(URLBACKEND + "utils/ActivityLog_Insert", 'LocalAdUser=' + userLogged.UbT_LocalADUuser + '&TaskName=BUM_LOG_INSERT&Status=DONE')
        .then(data => {
                processFinalized = true;
                $("#select-principal").prop("disabled", true);
                $("#tradeNameForm :input").prop("disabled", true);
                $("#customerAreaForm input").prop("disabled", true);
                $("#saveButton").prop("disabled", true);
                $("#automaticDistributionButton").prop("disabled", true);
                $('#divLogBumProcess').hide();
                getAlertMessage('FINALIZED_PROCESS_SUC');
        });
}

