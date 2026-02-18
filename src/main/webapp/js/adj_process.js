let currentPage = 1;
let pageSize = 25;
let totalRows = 0;

$(document).ready(function () {

    loadCombos();
    loadData();

    $("#btnFilter").on("click", function () {
        currentPage = 1;
        loadData();
    });

    $(document).on("change", ".country-check", function () {

        let selected = [];

        $(".country-check:checked").each(function () {
            selected.push($(this).next("label").text());
        });

        if (selected.length === 0) {
            $("#countryDropdown").text("Select Countries");
        } else if (selected.length === 1) {
            $("#countryDropdown").text(selected[0]);
        } else {
            $("#countryDropdown").text(selected.length + " countries selected");
        }

        loadBU();
    });

    $(document).on("change", ".business-type-check", function () {

        let selected = [];

        $(".business-type-check:checked").each(function () {
            selected.push($(this).val());
        });

        if (selected.length === 0) {
            $("#businessTypeDropdown").text("Select Business Type");
        } else if (selected.length === 1) {
            $("#businessTypeDropdown").text(selected[0]);
        } else {
            $("#businessTypeDropdown").text(selected.length + " selected");
        }

    });

    $(document).on("select2:open", function () {
        setTimeout(function () {
            document.querySelector(".select2-container--open .select2-search__field")?.focus();
        }, 0);
    });

    $(document).on("change", ".ilob-check", function () {

        let selected = [];

        $(".ilob-check:checked").each(function () {
            selected.push($(this).val());
        });

        if (selected.length === 0) {
            $("#ilobDropdown").text("Select ILOB");
        } else if (selected.length === 1) {
            $("#ilobDropdown").text(selected[0]);
        } else {
            $("#ilobDropdown").text(selected.length + " selected");
        }

    });



});

/* ============================================================
   SELECT2 INIT
============================================================ */

function enableSearchableSelect(selector) {

    if ($(selector).hasClass("select2-hidden-accessible")) {
        $(selector).select2('destroy');
    }

    $(selector).select2({
        theme: "bootstrap4",
        width: '100%',
        multiple: true,
        closeOnSelect: false,
        allowClear: true,
        placeholder: "Search..."
    });

}





/* ============================================================
   PARAMS
============================================================ */

function buildParams() {

    let selectedCountries = [];
    let selectedIlob = [];

    $(".country-check:checked").each(function () {
        selectedCountries.push($(this).val());
    });

    $(".ilob-check:checked").each(function () {
        selectedIlob.push($(this).val());
    });

    return {
        country: selectedCountries.length > 0
            ? selectedCountries.join(",")
            : null,

        ilob: selectedIlob.length > 0
            ? selectedIlob.join(",")
            : null,

        principal_number: ($("#filterPrincipal").val() || []).length > 0
            ? $("#filterPrincipal").val().join(",")
            : null,

        sr_name: $("#filterSalesManager").val() || null,

        pm_name: $("#filterProductManager").val() || null,

        address_name: ($("#filterAddressName").val() || []).length > 0
            ? $("#filterAddressName").val().join(",")
            : null,

        item_number: ($("#filterItemName").val() || []).length > 0
            ? $("#filterItemName").val().join(",")
            : null,

        income_type: $("#filterIncomeType").val() || null,

        bc: $("#filterBCC").val() || null,

        page: currentPage,
        pageSize: pageSize
    };
}


/* ============================================================
   DATA LOAD
============================================================ */

function loadData() {

    $.get("/budgettool/adj/data", buildParams(), function (response) {

        renderDetail(response.detail);
        renderTotals(response.totals);
        totalRows = response.totalRows || 0;
        renderPagination();

    });

}

/* ============================================================
   DETAIL
============================================================ */

function renderDetail(data) {

    const tbody = $("#adjTable tbody");
    tbody.empty();

    if (!data || data.length === 0) return;

    data.forEach(row => {

        let tr = "<tr>";

        tr += `<td>${row.BUSINESSTYPE || ''} / ${row.PRINCIPAL_NAME || ''}</td>`;
        tr += `<td>${row["UNIT PRICE ROY"] || 0}</td>`;
        tr += `<td>${row["UNIT PRICE BDG"] || 0}</td>`;
        tr += `<td>${row["QTY ROY"] || 0}</td>`;
        tr += `<td>${row["QTY FCS"] || 0}</td>`;
        tr += `<td>${row["QTY BDG"] || 0}</td>`;
        tr += `<td>${row["INV ROY"] || 0}</td>`;
        tr += `<td>${row["INV FCS"] || 0}</td>`;
        tr += `<td>${row["INV BDG"] || 0}</td>`;
        tr += `<td>${row["GM ROY"] || 0}</td>`;
        tr += `<td>${row["GM FCS"] || 0}</td>`;
        tr += `<td>${row["GM BDG"] || 0}</td>`;
        tr += `<td>${row["GMP ROY"] || 0}</td>`;
        tr += `<td>${row["GMP FCS"] || 0}</td>`;
        tr += `<td>${row["GMP BDG"] || 0}</td>`;

        tr += "</tr>";

        tbody.append(tr);
    });
}

/* ============================================================
   TOTALS
============================================================ */

function renderTotals(data) {

    if (!data || data.length === 0) return;

    const t = data[0];

    // Roy
    $("#QtyRoy").val(formatThousands(t.QtyRoy || 0));
    $("#InvRoy").val(formatThousands(t.InvRoy || 0));
    $("#GmRoy").val(formatThousands(t.GmRoy || 0));
    $("#GmPercRoy").val(formatPercent(t.GmPercRoy || 0));

    // Fcs (solo máscara, no editable)
    $("#QtyFcs").val(formatThousands(t.QtyFcs || 0));
    $("#InvFcs").val(formatThousands(t.InvFcs || 0));
    $("#GmFcs").val(formatThousands(t.GmFcs || 0));
    $("#GmPercFcs").val(formatPercent(t.GmPercFcs || 0));

    // Budget
    $("#QtyBdg").val(formatThousands(t.QtyBdg || 0));
    $("#InvBdg").val(formatThousands(t.InvBdg || 0));
    $("#GmBdg").val(formatThousands(t.GmBdg || 0));
    $("#GmPercBdg").val(formatPercent(t.GmPercBdg || 0));

    applyEditableStyle();
    updateTotalAreaTemp();
}


/* ============================================================
   PAGINATION
============================================================ */

function renderPagination() {

    let totalPages = Math.ceil(totalRows / pageSize);
    if (totalPages <= 1) return;

    if ($("#paginationContainer").length === 0) {

        $(".table-responsive").after(`
            <div id="paginationContainer" class="mt-3 d-flex justify-content-between align-items-center">
                <div>
                    <select id="pageSizeSelect" class="form-control">
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="250">250</option>
                        <option value="500">500</option>
                    </select>
                </div>
                <div>
                    <button id="prevPage" class="btn btn-secondary">Prev</button>
                    <span id="pageInfo"></span>
                    <button id="nextPage" class="btn btn-secondary">Next</button>
                </div>
            </div>
        `);

        $("#pageSizeSelect").val(pageSize);

        $("#pageSizeSelect").on("change", function () {
            pageSize = parseInt($(this).val());
            currentPage = 1;
            loadData();
        });

        $("#prevPage").on("click", function () {
            if (currentPage > 1) {
                currentPage--;
                loadData();
            }
        });

        $("#nextPage").on("click", function () {
            if (currentPage < totalPages) {
                currentPage++;
                loadData();
            }
        });
    }

    $("#pageInfo").text(`Page ${currentPage} of ${totalPages}`);

}

/* ============================================================
   COMBOS
============================================================ */

function loadCombos() {
    loadCountry();
    loadPrincipals();
    loadIlob();
    loadSR();
    loadPM();
    loadIncomeType();
    loadBusinessType();
    loadAddress();
    loadItems();
    loadBU();
    loadBC();
}

/* ---------------- COUNTRY ---------------- */

function loadCountry() {

    const countries = [
        { value: "41100 - ES", text: "Spain" },
        { value: "42100 - PT", text: "Portugal" },
        { value: "43100 - MA", text: "Morocco" }
    ];

    fillSelect("#filterCountry", countries, "value", "text");
}

/* ---------------- PRINCIPAL ---------------- */

function loadPrincipals() {

    $("#filterPrincipal").select2({
        theme: "bootstrap4",
        width: "100%",
        placeholder: "Search Principal...",
        minimumInputLength: 2,
        ajax: {
            url: "/budgettool/adj/principals-search",
            dataType: "json",
            delay: 300,
            data: function (params) {
                return {
                    search: params.term
                };
            },
            processResults: function (data) {
                return {
                    results: data.map(function (item) {
                        return {
                            id: item["PRINCIPAL_NUMBER"],
                            text: item["PRINCIPAL_NAME"]
                        };
                    })
                };
            }
        }
    });

}


function loadIlob() {

    $.get("/budgettool/adj/ilob", function (data) {

        const container = $("#ilobMenu");
        container.empty();

        if (!data) return;

        data.forEach((item, index) => {

            const id = "ilob_" + index;

            container.append(`
                <div class="form-check">
                    <input class="form-check-input ilob-check"
                           type="checkbox"
                           value="${item.ILOB}"
                           id="${id}">
                    <label class="form-check-label" for="${id}">
                        ${item.ILOB}
                    </label>
                </div>
            `);
        });

    });
}


function loadSR() {
    $.get("/budgettool/adj/sr", function (data) {
        fillSelect("#filterSalesManager", data, "SRNAME", "SRNAME", true);
    });
}

function loadPM() {
    $.get("/budgettool/adj/pm", function (data) {
        fillSelect("#filterProductManager", data, "PMNAME", "PMNAME", true);
    });
}

function loadIncomeType() {
    $.get("/budgettool/adj/income-type", function (data) {
        fillSelect("#filterIncomeType", data, "INCOMETYPE", "INCOMETYPE", true);
    });
}

function loadBusinessType() {

    $.get("/budgettool/adj/business-type", function (data) {

        const container = $("#businessTypeMenu");
        container.empty();

        if (!data) return;

        data.forEach((item, index) => {

            const id = "bt_" + index;

            container.append(`
                <div class="form-check">
                    <input class="form-check-input business-type-check"
                           type="checkbox"
                           value="${item.BUSINESSTYPE}"
                           id="${id}">
                    <label class="form-check-label" for="${id}">
                        ${item.BUSINESSTYPE}
                    </label>
                </div>
            `);
        });

    });
}


function loadAddress() {

    $("#filterAddressName").select2({
        theme: "bootstrap4",
        width: "100%",
        placeholder: "Search Address...",
        minimumInputLength: 2,
        ajax: {
            url: "/budgettool/adj/address-search",
            dataType: "json",
            delay: 300,
            data: function (params) {
                return {
                    search: params.term
                };
            },
            processResults: function (data) {
                return {
                    results: data.map(function (item) {
                        return {
                            id: item["ADDRESS NAME"],
                            text: item["ADDRESS NAME"]
                        };
                    })
                };
            }
        }
    });

}



function loadItems() {

    $("#filterItemName").select2({
        theme: "bootstrap4",
        width: "100%",
        placeholder: "Search Item...",
        minimumInputLength: 2,
        ajax: {
            url: "/budgettool/adj/items-search",
            dataType: "json",
            delay: 300,
            data: function (params) {
                return {
                    search: params.term
                };
            },
            processResults: function (data) {
                return {
                    results: data.map(function (item) {
                        return {
                            id: item["ITEM NUMBER"],
                            text: item["ITEM NAME"]
                        };
                    })
                };
            }
        }
    });

}



function loadBU() {

    let selectedCountries = [];

    $(".country-check:checked").each(function () {
        selectedCountries.push($(this).val());
    });

    let countryParam = selectedCountries.length > 0
        ? selectedCountries.join(",")
        : null;

    $.get("/budgettool/adj/bu", { country: countryParam }, function (data) {

        fillSelect("#filterBU", data, "BU", "BU_NAME", true);

    });
}


function loadBC() {
    $.get("/budgettool/adj/bc", function (data) {
        fillSelect("#filterBCC", data, "BC", "BC", true);
    });
}

/* ============================================================
    UTIL
 ============================================================ */

function fillSelect(selector, data, valueField, textField, includeAll = true) {

    const select = $(selector);
    select.empty();

    // Solo añadir "All" si NO es multiple
    if (includeAll && !select.prop("multiple")) {
        select.append(`<option value="">All</option>`);
    }

    if (!data) return;

    data.forEach(item => {
        select.append(
            `<option value="${item[valueField]}">${item[textField]}</option>`
        );
    });

}

/* ============================================================
   TOTAL AREA – EDITABLE GREEN + MASKS + TEMP STORAGE
============================================================ */

let totalAreaTemp = {
    roy: { qty: 0, inv: 0, gm: 0, gmp: 0 },
    budget: { qty: 0, inv: 0, gm: 0, gmp: 0 }
};

/* ================= MASKS ================= */

function formatThousands(value) {

    if (value === null || value === undefined) return "0";

    value = value.toString().replace(/\./g, "");
    value = value.replace(/\D/g, "");

    if (value === "") return "0";

    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatPercent(value) {

    if (value === null || value === undefined) return "00,00";

    value = value.toString().replace(/,/g, "");
    value = value.replace(/\D/g, "");

    while (value.length < 4) {
        value = "0" + value;
    }

    let intPart = value.slice(0, 2);
    let decPart = value.slice(2, 4);

    return intPart + "," + decPart;
}

/* ================= EDITABLE STYLE ================= */

function applyEditableStyle() {

    const editableFields = [
        "#QtyRoy", "#InvRoy", "#GmRoy", "#GmPercRoy",
        "#QtyBdg", "#InvBdg", "#GmBdg", "#GmPercBdg"
    ];

    editableFields.forEach(id => {
        $(id)
            .prop("readonly", false)
            .css({
                "background-color": "#28a745",
                "color": "#ffffff",
                "font-weight": "600"
            });
    });
}

/* ================= TEMP UPDATE ================= */

function updateTotalAreaTemp() {

    totalAreaTemp.roy.qty = $("#QtyRoy").val();
    totalAreaTemp.roy.inv = $("#InvRoy").val();
    totalAreaTemp.roy.gm = $("#GmRoy").val();
    totalAreaTemp.roy.gmp = $("#GmPercRoy").val();

    totalAreaTemp.budget.qty = $("#QtyBdg").val();
    totalAreaTemp.budget.inv = $("#InvBdg").val();
    totalAreaTemp.budget.gm = $("#GmBdg").val();
    totalAreaTemp.budget.gmp = $("#GmPercBdg").val();
}

/* ================= INPUT BINDING ================= */

$(document).on("input", "#QtyRoy, #InvRoy, #GmRoy, #QtyBdg, #InvBdg, #GmBdg", function () {

    $(this).val(formatThousands($(this).val()));
    updateTotalAreaTemp();
});

$(document).on("input", "#GmPercRoy, #GmPercBdg", function () {

    $(this).val(formatPercent($(this).val()));
    updateTotalAreaTemp();
});
