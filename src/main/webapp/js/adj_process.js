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

        loadBU(); // sigue funcionando con CSV
    });

});

/* ============================================================
   PARAMS
============================================================ */

function buildParams() {

    let selectedCountries = [];

    $(".country-check:checked").each(function () {
        selectedCountries.push($(this).val());
    });

    return {
        country: selectedCountries.length > 0 ? selectedCountries.join(",") : null,
        principal_number: $("#filterPrincipal").val() || null,
        sr_name: $("#filterSalesManager").val() || null,
        pm_name: $("#filterProductManager").val() || null,
        address_name: $("#filterAddressName").val() || null,
        item_number: $("#filterItemName").val() || null,
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

    $("#QtyRoy").val(t.QtyRoy || 0);
    $("#InvRoy").val(t.InvRoy || 0);
    $("#GmRoy").val(t.GmRoy || 0);
    $("#GmPercRoy").val(t.GmPercRoy || 0);

    $("#QtyFcs").val(t.QtyFcs || 0);
    $("#InvFcs").val(t.InvFcs || 0);
    $("#GmFcs").val(t.GmFcs || 0);
    $("#GmPercFcs").val(t.GmPercFcs || 0);

    $("#QtyBdg").val(t.QtyBdg || 0);
    $("#InvBdg").val(t.InvBdg || 0);
    $("#GmBdg").val(t.GmBdg || 0);
    $("#GmPercBdg").val(t.GmPercBdg || 0);

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
    loadPrincipal();
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

function loadPrincipal() {
    $.get("/budgettool/adj/principals", function (data) {
        fillSelect("#filterPrincipal", data, "PRINCIPAL_NUMBER", "PRINCIPAL_NAME", true);
    });
}

function loadIlob() {
    $.get("/budgettool/adj/ilob", function (data) {
        fillSelect("#filterIlob", data, "ILOB", "ILOB", true);
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
        fillSelect("#filterBusinessType", data, "BUSINESSTYPE", "BUSINESSTYPE", true);
    });
}

function loadAddress() {
    $.get("/budgettool/adj/address", function (data) {
        fillSelect("#filterAddressName", data, "ADDRESS NAME", "ADDRESS NAME", true);
    });
}

function loadItems() {
    $.get("/budgettool/adj/items", function (data) {
        fillSelect("#filterItemName", data, "ITEM NUMBER", "ITEM NAME", true);
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

    if (includeAll) {
        select.append(`<option value="">All</option>`);
    }

    if (!data) return;

    data.forEach(item => {
        select.append(
            `<option value="${item[valueField]}">${item[textField]}</option>`
        );
    });
}

