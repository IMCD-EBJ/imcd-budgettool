//const URLBACKEND = "http://10.208.2.70:8080/";
// const URLBACKEND = "http://10.208.2.140:8080/";
//const APP_NAME = "pricetool";
// const APP_NAME = "mosaic";
const APP_NAME = "budgettool";
const APP_URL = "/" + APP_NAME;
//const APP_URL = "/pricetool-mo";
// const URLBACKEND = "http://localhost:8080" + APP_URL + "/";
const URLBACKEND = "https://localapps.imcd.es"+APP_URL+"/";
//  const URLBACKEND = "http://10.208.2.70:8082"+APP_URL+"/";

let userLogged;
let isCambiosRealizados;
let rol = 'all';
let esBUM;
let esMM;
let esPM;
let esSR;
let activeRol;

var arrayInputsOrdenados;
var actualInput = 0;

let months = [
    {'id': '', 'name': 'Select an option'},
    {'id': 'JANUARY', 'name': 'January'},
    {'id': 'FEBRUARY', 'name': 'February'},
    {'id': 'MARCH', 'name': 'March'},
    {'id': 'APRIL', 'name': 'April'},
    {'id': 'MAY', 'name': 'May'},
    {'id': 'JUNE', 'name': 'June'},
    {'id': 'JULY', 'name': 'July'},
    {'id': 'AUGUST', 'name': 'August'},
    {'id': 'SEPTEMBER', 'name': 'September'},
    {'id': 'OCTOBER', 'name': 'October'},
    {'id': 'NOVEMBER', 'name': 'November'},
    {'id': 'DECEMBER', 'name': 'December'}
];

//valido que sino estoy en

document.addEventListener("DOMContentLoaded", async () => {
    let userJson = localStorage.getItem(APP_NAME + "usuario");

    if (userJson === null) {
        try {
            await login();
            getLandingPageByRol().then(pantalla => {
                location.href = pantalla
            });
        } catch (error) {
            console.error("Login failed:", error);
            return;
        }
    } else {
        let userJson = localStorage.getItem(APP_NAME + "usuario");
        if (userJson) {
            try {

                userLogged = JSON.parse(userJson);
                // usuarioLogueado = userLogged.UMT_Id; ESTA UMT_Id en PRE
                usuarioLogueado = userLogged.UBT_Id;
                //loadDropDown($('#select-delegation'), "delegation/usersList?userActive=" + userLogged.UbT_LocalADUuser, "name", "name");
                document.addEventListener('keydown', (event) => {
                    if (event.key == 'Tab') {
                        if (event.target.classList.contains('editable')) {
                            event.preventDefault();
                            var nextElement = null;
                            if (!event.shiftKey) {
                                if (actualInput + 1 == arrayInputsOrdenados.length) {
                                    nextElement = arrayInputsOrdenados[0];
                                } else {
                                    nextElement = arrayInputsOrdenados[actualInput + 1];
                                }
                            } else {
                                if (actualInput == 0) {
                                    nextElement = arrayInputsOrdenados[arrayInputsOrdenados.length - 1];
                                } else {
                                    nextElement = arrayInputsOrdenados[actualInput - 1];
                                }

                            }

                            if (nextElement != null) {
                                nextElement.focus();
                            }
                        }
                    }
                }, false);
            } catch (e) {
                logout();
                //localStorage.clear();
                //location.href = "login.html";
            }
        }

        // Poner texto sidebar de color
        let paramCss = "menu_color";
        var cssFile = localStorage.getItem(APP_NAME + paramCss);
        if (cssFile) {
            setCssFile(cssFile);
        } else {
            getConfigurationParam(paramCss).then(result => {
                cssFile = result[paramCss];
                localStorage.setItem(APP_NAME + paramCss, cssFile);
                setCssFile(cssFile);
            });
        }
    }


});


function formatDate(date, separator = '-') {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join(separator);
}

function parseArrayText(array) {
    var text = '';
    array.forEach((element, index) => {
        text += index == 0 ? element : ', ' + element;
    });
    return text;
}

function login() {

    return $.post({url: URLBACKEND + "login_app"})
        .then(function (data) {
            let userJson = {};
            userJson.Profiles = [];

            userJson.CFG_SendEmail = data[0].CFG_SendEmail;
            userJson.UBT_Id = data[0].UBT_Id;
            userJson.UBT_Mail = data[0].UBT_Mail;
            userJson.UbT_LocalADUuser = data[0].UbT_LocalADUuser;
            userJson.bu_agrupada = data[0].bu_agrupada;
            userJson.UBT_UserName = data[0].UBT_UserName;
            data.map(itm => {
                userJson.Profiles.push(itm.UBT_TipoUserId)
            })
            localStorage.setItem(APP_NAME + "usuario", JSON.stringify(userJson));
            localStorage.setItem(APP_NAME + "usuarioOriginal", JSON.stringify(userJson));
            insertLogActivity(userJson.UbT_LocalADUuser, 'LOGIN', 'DONE');
            userLogged = userJson;
            localStorage.removeItem('activeRol');
        }).catch(function (e) {
        if (e.status === 401) {
            getAlertMessage("INCORRECT_LOGIN_WAR")
        } else
            alert("Ocurrio un error al consultar contra la api")
    });
}

function logout() {
    getAlertMessage("LOGOUT_WAR", function (willDelete) {
        if (willDelete) {
            for (var i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.toLowerCase().indexOf(APP_NAME) >= 0) {
                    localStorage.removeItem(key);
                }
            }
            location.href = "login.html";
        }
    });
}

async function insertLogActivity(user, taskName, status) {
    await $.post(URLBACKEND + "utils/ActivityLog_Insert", 'LocalAdUser=' + user + '&TaskName=' + taskName + '&Status=' + status);
}

function capitalizeFirstLetterString(str) {


    //split the above string into an array of strings
    //whenever a blank space is encountered

    const arr = str.split(" ");

    //loop through each element of the array and capitalize the first letter.


    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);

    }

    //Join all the elements of the array back into a string
    //using a blankspace as a separator
    const str2 = arr.join(" ");
    return str2
}

async function loadDropDown(target, endpoint, valuefield, textfield, showSelectAnOption, withSelected = false, capitalize = false) {
    try {
        target.empty();
        var data = await $.get({
            url: URLBACKEND + endpoint,
            type: 'Get'//,
            //timeout: 500
        });
        var result = data;
        if (showSelectAnOption == null || showSelectAnOption == true)
            target.append('<option value="">select an option</option>');
        result.forEach(item => {

            if (capitalize) {
                item[valuefield] = item[valuefield] ?
                    item[valuefield].toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, function (letter) {
                        return letter.toUpperCase();
                    }) : '';
            }

            generateOption(withSelected, item.selected, eval("item." + valuefield), eval("item." + textfield), target);
        })
        target.prop('disabled', false);
    } catch (e) {
        target.prop('disabled', true);
        target.append('<option>Error loading select options</option>');
        console.log(e)
    }
}

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
};

function generateOption(withSelected, selected, valuefield, textfield, target) {
    if (withSelected) {
        if (selected == 0)
            target.append('<option value="' + valuefield + '">' + textfield + '</option>');
        else
            target.append('<option value="' + valuefield + '" selected>' + textfield + '</option>');
    } else
        target.append('<option value="' + valuefield + '">' + textfield + '</option>');
}

async function grabarHeaderUniverseEnLocalStorage(idUniverso) {
    await $.get(URLBACKEND + "/universe/" + idUniverso)
        .then(datos => {
            localStorage.setItem(APP_NAME + "universe_header", JSON.stringify(datos))
        });
}

function tableToJson() {
    var myRows = [];
    var $headers = $("th");
    var $rows = $("tbody tr").each(function (index) {
        $cells = $(this).find("td");
        myRows[index] = {};
        $cells.each(function (cellIndex) {
            let nombreColumna = $($headers[cellIndex]).attr("name") == null ? $($headers[cellIndex]).attr("data-field") : $($headers[cellIndex]).attr("name");

            if ($(this)[0].childElementCount == 0) {
                if ($(this).html() == "undefined" || $(this).html() == "null")
                    myRows[index][nombreColumna] = null;
                else
                    myRows[index][nombreColumna] = $(this).html();
            } else {
                if ($(this)[0].children.length == 1 && $(this)[0].children[0].tagName == "SMALL")
                    myRows[index][nombreColumna] = $(this)[0].children[0].innerText
                else {
                    let inputValue = $(this)[0].getElementsByTagName("input").length > 0 && $(this)[0].getElementsByTagName("input")[0].type == "text" ? $(this)[0].getElementsByTagName("input")[0].value : null;
                    let checkValue = $(this)[0].getElementsByTagName("input").length > 0 && $(this)[0].getElementsByTagName("input")[0].type == "checkbox" ? $(this)[0].getElementsByTagName("input")[0].checked : null;
                    let smallValue = $(this)[0].getElementsByTagName("small").length > 0 ? $(this)[0].getElementsByTagName("small")[1] : null;

                    if (checkValue != null)
                        myRows[index][nombreColumna] = checkValue
                    else if (inputValue == null)
                        if (smallValue != null) {
                            myRows[index][nombreColumna] = smallValue.innerText
                        } else {
                            myRows[index][nombreColumna] = $(this)[0].children[0].value
                        }
                    else
                        myRows[index][nombreColumna] = inputValue;
                }
            }
        });
    });

    // Let's put this in the object like you want and convert to JSON (Note: jQuery will also do this for you on the Ajax request)
    var myObj = {};
    myObj.myrows = myRows;
    return myObj;
}

const isDecimalKey = (event, input) => {
    const patt = /^\d+\.{0,1}\d{0,2}$/;
    if (event.key == ".") {
        if (input.value.indexOf(".") > 0) {
            event.preventDefault();
        }
    } else {
        if (!patt.test(event.key)) {
            event.preventDefault();
            return;
        }
    }
}

const isDecimalPercentKey = (event, input) => {
    const patt = /^([0-9]\d?|100)(\.\d{1,2})?$/;
    if (event.key == ",") {
        if (input.value == 100) {
            event.preventDefault();
        } else if (input.value.indexOf(",") > 0) {
            event.preventDefault();
        }
    } else {
        if (!patt.test(event.key)) {
            event.preventDefault();
            return;
        }
        if (parseFloat(input.value + event.key) > 100) {
            if (!isTextSelected(input))
                event.preventDefault();
        }
    }
}

function isTextSelected(input) {
    var selecttxt = '';
    if (window.getSelection) {
        selecttxt = window.getSelection();
    } else if (document.getSelection) {
        selecttxt = document.getSelection();
    } else if (document.selection) {
        selecttxt = document.selection.createRange().text;
    }

    if (selecttxt == '') {
        return false;
    }
    return true;

}

const isIntegerKey = (event, input) => {
    const patt = /^-?\d+$/;

    if (!patt.test(event.key)) {
        event.preventDefault();
        return;
    }
}

const formatNumber = number => number
    ? number.toString().split('').reverse().join('').replace(/(?=\d*\.?)(\d{3})/g, '$1.').split('').reverse().join('').replace(/^[\.]/, '')
    : 0;

function sendMail(idMensaje, PPCH_Id) {
    $.post(URLBACKEND + "email/send", "idMensaje=" + idMensaje + "&PPCH_Id=" + PPCH_Id + "&UBT_Id=" + userLogged.UBT_Id)
}

function infoApp() {
    let content = "";
    $.get({
        url: URLBACKEND + "utils/info_pricetool?UBT_Id=" + userLogged.UBT_Id,
        type: 'Get'
    }).then(data => {
        content += data.version + "\n";
        content += data.environment + "\n";
        content += data.userInfo.replaceAll("\\n", "\n") + "\n";
        swal("INFO BUDGETTOOL", content);
    });
}

function getAlertMessage(idMensaje, funcion, cont, funcion2) {
    $.get({
        url: URLBACKEND + "utils/configurationAlertMessage?idMensaje=" + idMensaje,
        type: 'Get'//,
        //timeout: 1000
    })
        .then(tableData => {
            tableData[0].body = tableData[0].body ? tableData[0].body.replace("\\n", "\n") : '';
            console.log(tableData[0].body);
            let swaltext
            switch (tableData[0].type) {
                case 'Simple':  //OK
                    swal(tableData[0].title, tableData[0].body, tableData[0].icon)
                    return
                case 'ErrorText':   //OK
                    swaltext = tableData[0].body + '\n' + cont;
                    swal(tableData[0].title, swaltext, tableData[0].icon)
                    return
                case 'ErrorTextThen':   //FALTA TEST
                    swaltext = tableData[0].body + '\n' + cont;
                    swal(tableData[0].title, swaltext, tableData[0].icon)
                        .then((result) => {
                            funcion();
                        })
                    return
                case 'Then':    //OK
                    swal(tableData[0].title, tableData[0].body, tableData[0].icon)
                        .then((result) => {
                            funcion();
                        })
                    return
                case 'Confirm': //OK
                    swal(tableData[0].title, tableData[0].body, tableData[0].icon)
                        .then((result) => {
                            if (result) {
                                funcion();
                            }
                        })
                    return
                case 'ConfirmNotConfirm':   //NO SE UTILIZA
                    swal(tableData[0].title, tableData[0].body, tableData[0].icon)
                        .then((result) => {
                            if (result) {
                                funcion();
                            } else funcion2();
                        })
                case 'Buttons': //OK
                    let dngMode
                    if (tableData[0].dangerMode == 1) dngMode = true;
                    else dngMode = false;
                    swal({
                        title: tableData[0].title,
                        text: tableData[0].body,
                        icon: tableData[0].icon,
                        dangerMode: dngMode,
                        buttons: [
                            tableData[0].button1,
                            tableData[0].button2
                        ]
                    }).then((result) => {
                        funcion(result);
                    })
                    return
                case 'Form':
                    swal({
                        title: tableData[0].title,
                        content: cont,
                        icon: tableData[0].icon,
                    })
                    return
                case 'Input':   //OK
                    swal({
                        title: tableData[0].title,
                        content: cont,
                        icon: tableData[0].icon,
                        dangerMode: true,
                        buttons: [
                            tableData[0].button1,
                            tableData[0].button2
                        ],
                    }).then((result) => {
                        if (result) {
                            funcion(result);
                        }
                    });
            }
        })
}

async function unsavedRedirect(objectAction, type) {
    if (isCambiosRealizados) {
        if (type === 'redirect' && objectAction.includes("#")) return;
        event.preventDefault();
        getAlertMessage("UNSAVED_CHANGES_WAR", function (isConfirm) {
            if (isConfirm) {
                isCambiosRealizados = false;
                switch (type) {
                    case 'redirect':
                        window.location.href = objectAction;
                        break;
                    case 'table':
                        var $table = $(objectAction).bootstrapTable();
                        $table.bootstrapTable('refresh');
                        break;
                    case 'function':
                        objectAction();
                        break;
                }
            }
        });
    } else if (type === 'function') {
        objectAction();
    } else if (type === 'table') {
        var $table = $(objectAction).bootstrapTable();
        $table.bootstrapTable('refresh');
    }
}

async function getConfigurationParam(param) {
    return $.get(URLBACKEND + "utils/configuration/" + param)
}


function setCssFile(cssFile) {
    if (cssFile && cssFile !== 'default') {
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'styles/sidebar-' + cssFile + '.css';
        head.appendChild(link);
    }
}

async function editarHeader(PPCH_Id, PPCS_Desc, url = null) {
    await grabarHeaderUniverseEnLocalStorage(PPCH_Id);
    if (PPCS_Desc == "Universe_Completed")
        window.location.href = "universe_jdeFiles.html";
    else if (PPCS_Desc == "PRC_Completing" || PPCS_Desc == "PPC_Completed") {
        if (userLogged.Profiles.filter((itm) => {
            return itm == "BUM" || itm == "BUMBC" || itm == "SR"
                || itm == "SRBCC" || itm == "PRMAN"
        }).length > 0)
            window.location.href = "universe_PRC_salesprice.html";
        else
            getAlertMessage("BUM_SR_PRMAN_WAR")
    } else
        window.location.href = "universe_header.html?edit=true";

    if (url) {
        window.location.href = url;
    }
}

function changeDelegatedUser() {
    var usuario = $('#select-delegation').val();
    $.post({url: URLBACKEND + "delegation/changeUser?username=" + usuario})
        .then(function (data) {
            //TODO guardar el JWT en el localstorage y luego redireccionar
            let userJson = {};
            userJson.Profiles = [];

            userJson.CFG_SendEmail = data[0].CFG_SendEmail;
            userJson.UBT_Id = data[0].UBT_Id;
            userJson.UBT_Mail = data[0].UBT_Mail;
            userJson.UbT_LocalADUuser = data[0].UbT_LocalADUuser;
            userJson.UBT_UserName = data[0].UBT_UserName;
            userJson.bu_agrupada = data[0].bu_agrupada;
            data.map(itm => {
                userJson.Profiles.push(itm.UBT_TipoUserId)
            })
            localStorage.setItem(APP_NAME + "usuario", JSON.stringify(userJson));
            var userOriginal = JSON.parse(localStorage.getItem(APP_NAME + "usuarioOriginal"));
            insertLogActivity(userOriginal.UbT_LocalADUuser, 'DELEGATION TO USER:' + userJson.UbT_LocalADUuser, 'DONE');

            localStorage.removeItem('activeRol');
            location.reload();

        }).catch(function (e) {
        if (e.status === 401) {
            getAlertMessage("INCORRECT_LOGIN_WAR")
        } else
            alert("Ocurrio un error al consultar contra la api")
    });
}

function changeOriginalUser() {
    localStorage.setItem(APP_NAME + "usuario", localStorage.getItem(APP_NAME + "usuarioOriginal"));
    localStorage.removeItem('activeRol');
    location.reload();

}

function gestionRoles() {
    var roles = [...new Set(userLogged.Profiles)].sort();

    if (roles.length > 1 && (roles.includes('BUM') || roles.includes('MM'))) {

        if ((!roles.includes('MM')) || (roles.includes('BUM') && roles.includes('MM')) || (roles.includes('PM') && roles.includes('MM'))) {
            $('#rolesCardDiv').show();
        } else {
            $('#rolesCardDiv').hide();
        }

        var pantalla = window.location.pathname.split('/')[2].split('.')[0];
        if (pantalla == 'bum_process') {
            $('#rolesCardDiv').hide();
        }

        if (pantalla == 'pm_process' && !roles.includes('PM')) {
            $('#rolesCardDiv').hide();
        }

        if (pantalla == 'sr_process' && !roles.includes('SR')) {
            $('#rolesCardDiv').hide();
        }


        createDivRoles(roles);
        activeRol = localStorage.getItem('activeRol');
        if (activeRol == null) {
            if (roles.includes('BUM')) {
                activeRol = 'BUM'
            } else if (roles.includes('MM')) {
                activeRol = 'MM'
            } else if (roles.includes('PM')) {
                activeRol = 'PM'
            } else if (roles.includes('SR')) {
                activeRol = 'SR'
            }
        }
        document.getElementById(activeRol).checked = true;
        changeActiveRol(false);
    } else if (roles.includes('ADMIN')) {
        activeRol = 'BUM';
        var rolesDiv = document.getElementById('roles');
        var divRadio = document.createElement('div');
        divRadio.classList.add('form-check', 'form-check-inline');

        var radio = document.createElement('input');
        radio.name = 'rol';
        radio.type = 'radio';
        radio.value = 'BUM';
        radio.id = 'BUM';
        radio.classList.add('form-check-input');
        divRadio.appendChild(radio);
        rolesDiv.appendChild(divRadio);
        document.getElementById(activeRol).checked = true;
        changeActiveRol(false);
    } else {
        createDivRoles(roles)
        activeRol = localStorage.getItem('activeRol');
        if (activeRol == null) {
            if (roles.includes('PM')) {
                activeRol = 'PM'
            } else if (roles.includes('SR')) {
                activeRol = 'SR'
            }
        }
        document.getElementById(activeRol).checked = true;
        changeActiveRol(false);
    }
}

function createDivRoles(roles) {
    var rolesDiv = document.getElementById('roles');

    roles.forEach(rol => {
        var divRadio = document.createElement('div');
        divRadio.classList.add('form-check', 'form-check-inline');

        var radio = document.createElement('input');
        radio.name = 'rol';
        radio.type = 'radio';
        radio.value = rol;
        radio.id = rol;
        radio.classList.add('form-check-input');

        var label = document.createElement('label');
        label.setAttribute('for', rol);
        label.appendChild(document.createTextNode(rol));
        label.classList.add('form-check-label');
        divRadio.appendChild(label);
        divRadio.appendChild(radio);
        rolesDiv.appendChild(divRadio);
    });
}

function changeActiveRol(reload) {

    activeRol = Array.from(document.getElementsByName('rol')).filter(radioButton => radioButton.checked)[0].value;
    var previousRol = localStorage.getItem('activeRol');
    localStorage.setItem('activeRol', activeRol)

    esBUM = (activeRol == 'BUM');
    esMM = (activeRol == 'MM');
    esPM = (activeRol == 'PM');
    esSR = (activeRol == 'SR');

    if (reload) {
        if (userLogged.Profiles.some(profile => profile == 'BUM' || profile == 'MM')) {
            location.reload();
        } else {
            getLandingPageByRol().then(pantalla => {
                location.href = pantalla
            })
        }
    }
}

async function getLandingPageByRol() {
    gestionRoles();
    var promises = [getConfigurationParam('CFG_ShowBUMProcess'), getConfigurationParam('CFG_ShowPMProcess'), getConfigurationParam('CFG_ShowSRProcess')];
    var parametros = await Promise.all(promises);
    var CFGBUM = parametros[0]['CFG_ShowBUMProcess'] == '1'
    var CFGPM = parametros[1]['CFG_ShowPMProcess'] == '1';
    var CFGSR = parametros[2]['CFG_ShowSRProcess'] == '1';

    var pantalla;

    if (esBUM) {
        if (CFGBUM) {
            pantalla = "bum_process.html";
        } else if (CFGPM) {
            pantalla = "pm_process.html";
        } else if (CFGSR) {
            pantalla = "sr_process.html";
        } else {
            pantalla = "index.html";
        }
    } else if (esPM || esMM) {
        if (CFGPM) {
            pantalla = "pm_process.html";
        } else if (CFGSR) {
            pantalla = "sr_process.html";
        } else {
            pantalla = "index.html";
        }
    } else if (esSR) {
        if (CFGSR) {
            pantalla = "sr_process.html";
        } else {
            pantalla = "index.html";
        }
    } else {
        pantalla = "index.html";
    }

    return pantalla;
}

function removeThousandsMask(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".").replaceAll('.', '');
}


function putThousandsMask(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function previousSelectedOption(selectId) {
    if (isCambiosRealizados) {
        getAlertMessage("UNSAVED_CHANGES_WAR", function (isConfirm) {
            if (isConfirm) {
                isCambiosRealizados = false;
                var select = document.getElementById(selectId);
                var optionsLength = select.querySelectorAll('option').length;

                if (select.selectedIndex - 1 > 0 && optionsLength > 1) {
                    select.selectedIndex--;
                    select.onchange();
                }
            }
        });
    } else {
        var select = document.getElementById(selectId);
        var optionsLength = select.querySelectorAll('option').length;

        if (select.selectedIndex - 1 > 0 && optionsLength > 1) {
            select.selectedIndex--;
            select.onchange();
        }
    }
}

async function nextSelectedOption(selectId) {
    if (isCambiosRealizados) {
        getAlertMessage("UNSAVED_CHANGES_WAR", function (isConfirm) {
            if (isConfirm) {
                isCambiosRealizados = false;
                var select = document.getElementById(selectId);
                var optionsLength = select.querySelectorAll('option').length;

                if (optionsLength > 1 && select.selectedIndex + 1 < optionsLength) {
                    select.selectedIndex++;
                    select.onchange();
                }
            }
        });
    } else {
        var select = document.getElementById(selectId);
        var optionsLength = select.querySelectorAll('option').length;

        if (optionsLength > 1 && select.selectedIndex + 1 < optionsLength) {
            select.selectedIndex++;
            select.onchange();
        } else {
            updateSelectedOption(selectId);
        }
    }
}

function updateSelectedOption(id) {
    var selectRepLine = document.getElementById(id);
    var optionsLength = selectRepLine.querySelectorAll('option').length;
    selectRepLine.parentNode.parentNode.lastElementChild.querySelector('small').innerText = selectRepLine.selectedIndex + ' of ' + (optionsLength - 1)
}

Array.prototype.hasMin = function (attrib) {
    return (this.length && this.reduce(function (prev, curr) {
        return (prev[attrib] < curr[attrib]) ? prev : curr;
    })) || null;
}
Array.prototype.hasMax = function (attrib) {
    return (this.length && this.reduce(function (prev, curr) {
        return (prev[attrib] > curr[attrib]) ? prev : curr;
    })) || null;
}

function setZeroValueInputsNaN() {
    Array.from(document.querySelectorAll('input'))
        .filter(input => input.value.includes('NaN'))
        .forEach(input => input.value = '0,0')
}

//Function that checks if a string value has no decimals it will add a decimal separator and a 0 to the value as a string
function checkDecimals(value, inputType) {
    if (inputType == 'VAR' && !value.includes(',')) {
        value += ',0';
    } else if (inputType == 'PERC' && !value.includes(',')) {
        value += ',00';
    }
    return value;
}
