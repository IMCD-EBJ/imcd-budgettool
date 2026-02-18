let currentPage = 1;
let pageSize = 5;
let totalRows = 0;

$(document).ready(function () {

    loadCombos();
    loadSeasonality();

    /* ---------- BOTÓN ADD (si lo usas luego) ---------- */
    $("#btnAdd").on("click", function () {
        currentPage = 1;
        loadSeasonality();
    });

    /* ---------- COUNTRY ---------- */
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

    /* ---------- BUSINESS TYPE ---------- */
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

    /* ---------- ILOB ---------- */
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

    /* ---------- SELECT2 FOCUS ---------- */
    $(document).on("select2:open", function () {
        setTimeout(function () {
            document
                .querySelector(".select2-container--open .select2-search__field")
                ?.focus();
        }, 0);
    });

});

/* ============================================================
   SEASONALITY LIST
============================================================ */

function loadSeasonality() {

    $.get("/budgettool/export-snowflake/list", {
        page: currentPage,
        pageSize: pageSize
    })
    .done(function (response) {

        if (!response || typeof response !== "object") return;

        renderSeasonality(response.data || []);
        totalRows = response.totalRows || 0;
        renderPagination();

    })
    .fail(function (xhr) {
        console.error("Error loading seasonality list", xhr.responseText);
    });
}

function renderSeasonality(data) {

    const container = $("#seasonalityContainer");
    container.empty();

    if (!data || data.length === 0) {
        container.append("<div class='text-muted'>No records found</div>");
        return;
    }

    data.forEach(function (row, index) {

        const executionOrder = row.EXECUTION_ORDER != null
            ? row.EXECUTION_ORDER
            : (index + 1);

        let html = `
        <div class="card mb-4 border-0 shadow-sm">

            <!-- HEADER -->
            <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center">

                <div class="d-flex align-items-center">

                    <span class="badge badge-primary mr-3 px-3 py-2">
                        #${executionOrder}
                    </span>

                    <h6 class="mb-0 font-weight-bold text-dark">
                        ${row.SEASONALITY_NAME || 'Unnamed'}
                    </h6>

                </div>

                <div class="btn-group btn-group-sm">

                    <button class="btn btn-outline-secondary"
                        title="Move up"
                        onclick="moveSeasonality(${row.SEASONALITY_ID || 0}, 'UP')">
                        ↑
                    </button>

                    <button class="btn btn-outline-secondary"
                        title="Move down"
                        onclick="moveSeasonality(${row.SEASONALITY_ID || 0}, 'DOWN')">
                        ↓
                    </button>

                    <button class="btn btn-outline-danger"
                        title="Delete"
                        onclick="deleteSeasonality(${row.SEASONALITY_ID || 0})">
                        Delete
                    </button>

                </div>

            </div>

            <!-- BODY -->
            <div class="card-body">

                <!-- METADATA -->
                <div class="row small text-muted mb-3">

                    <div class="col-md-2"><strong>Country</strong><br>${row.COUNTRY || 'ALL'}</div>
                    <div class="col-md-2"><strong>Principal</strong><br>${row.PRINCIPAL_NUMBER || 'ALL'}</div>
                    <div class="col-md-2"><strong>ILOB</strong><br>${row.ILOB || 'ALL'}</div>
                    <div class="col-md-2"><strong>PM</strong><br>${row.PM_NAME || 'ALL'}</div>
                    <div class="col-md-2"><strong>BU</strong><br>${row.BU || 'ALL'}</div>
                    <div class="col-md-2"><strong>Item</strong><br>${row.ITEM_NUMBER || 'ALL'}</div>

                </div>

                <!-- MONTH GRID -->
                <div class="row text-center border-top pt-3">

                    <div class="col">${renderMonthBlock("JAN", row.PERC_JAN)}</div>
                    <div class="col">${renderMonthBlock("FEB", row.PERC_FEB)}</div>
                    <div class="col">${renderMonthBlock("MAR", row.PERC_MAR)}</div>
                    <div class="col">${renderMonthBlock("APR", row.PERC_APR)}</div>
                    <div class="col">${renderMonthBlock("MAY", row.PERC_MAY)}</div>
                    <div class="col">${renderMonthBlock("JUN", row.PERC_JUN)}</div>
                    <div class="col">${renderMonthBlock("JUL", row.PERC_JUL)}</div>
                    <div class="col">${renderMonthBlock("AUG", row.PERC_AUG)}</div>
                    <div class="col">${renderMonthBlock("SEP", row.PERC_SEP)}</div>
                    <div class="col">${renderMonthBlock("OCT", row.PERC_OCT)}</div>
                    <div class="col">${renderMonthBlock("NOV", row.PERC_NOV)}</div>
                    <div class="col">${renderMonthBlock("DEC", row.PERC_DEC)}</div>

                </div>

            </div>

        </div>
        `;

        container.append(html);
    });
}

/* BLOQUE VISUAL MES */
function renderMonthBlock(label, value) {

    return `
        <div class="border rounded py-2 bg-light">
            <div class="small text-muted">${label}</div>
            <div class="font-weight-bold">${safe(value)}%</div>
        </div>
    `;
}

function safe(val) {
    if (val === null || val === undefined || val === "") {
        return 0;
    }
    return val;
}



function renderMonths(r) {

    return `
        <div class="col-md-1">JAN<br>${r.PERC_JAN || 0}%</div>
        <div class="col-md-1">FEB<br>${r.PERC_FEB || 0}%</div>
        <div class="col-md-1">MAR<br>${r.PERC_MAR || 0}%</div>
        <div class="col-md-1">APR<br>${r.PERC_APR || 0}%</div>
        <div class="col-md-1">MAY<br>${r.PERC_MAY || 0}%</div>
        <div class="col-md-1">JUN<br>${r.PERC_JUN || 0}%</div>
        <div class="col-md-1">JUL<br>${r.PERC_JUL || 0}%</div>
        <div class="col-md-1">AUG<br>${r.PERC_AUG || 0}%</div>
        <div class="col-md-1">SEP<br>${r.PERC_SEP || 0}%</div>
        <div class="col-md-1">OCT<br>${r.PERC_OCT || 0}%</div>
        <div class="col-md-1">NOV<br>${r.PERC_NOV || 0}%</div>
        <div class="col-md-1">DEC<br>${r.PERC_DEC || 0}%</div>
    `;
}

function moveSeasonality(id, direction) {

    $.post("/budgettool/export-snowflake/move", {
        seasonalityId: id,
        direction: direction
    }, function () {
        loadSeasonality();
    });
}

function deleteSeasonality(id) {

    if (!confirm("Delete this record?")) return;

    $.post("/budgettool/export-snowflake/delete", {
        seasonalityId: id
    }, function () {
        loadSeasonality();
    });
}

function renderPagination() {

    const totalPages = Math.ceil(totalRows / pageSize);
    const container = $("#paginationSeasonality");
    container.empty();

    container.append(`
        <div>Page ${currentPage} of ${totalPages || 1}</div>
        <div>
            <button class="btn btn-secondary btn-sm"
                onclick="prevPage()">Prev</button>
            <button class="btn btn-secondary btn-sm"
                onclick="nextPage()">Next</button>
        </div>
    `);
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadSeasonality();
    }
}

function nextPage() {
    if (currentPage * pageSize < totalRows) {
        currentPage++;
        loadSeasonality();
    }
}

/* ============================================================
   COMBOS (CLON EXACTO DE ADJ_PROCESS)
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

function loadCountry() {
    // checkboxes ya están en HTML
}

/* PRINCIPAL */

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
                return { search: params.term };
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

/* ILOB */

function loadIlob() {

    $.get("/budgettool/adj/ilob", function (data) {

        const container = $("#ilobMenu");
        container.empty();

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

/* SR */

function loadSR() {
    $.get("/budgettool/adj/sr", function (data) {
        fillSelect("#filterSalesManager", data, "SRNAME", "SRNAME", true);
    });
}

/* PM */

function loadPM() {
    $.get("/budgettool/adj/pm", function (data) {
        fillSelect("#filterProductManager", data, "PMNAME", "PMNAME", true);
    });
}

/* INCOME TYPE */

function loadIncomeType() {
    $.get("/budgettool/adj/income-type", function (data) {
        fillSelect("#filterIncomeType", data, "INCOMETYPE", "INCOMETYPE", true);
    });
}

/* BUSINESS TYPE */

function loadBusinessType() {

    $.get("/budgettool/adj/business-type", function (data) {

        const container = $("#businessTypeMenu");
        container.empty();

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

/* ADDRESS */

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
                return { search: params.term };
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

/* ITEMS */

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
                return { search: params.term };
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

/* BU */

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

/* BC */

function loadBC() {
    $.get("/budgettool/adj/bc", function (data) {
        fillSelect("#filterBCC", data, "BC", "BC", true);
    });
}

/* UTIL */

function fillSelect(selector, data, valueField, textField, includeAll = true) {

    const select = $(selector);
    select.empty();

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

$("#btnAddSeasonality").on("click", function () {

    let filterName = $("#filterName").val().trim();

    if (!filterName) {
        alert("FILTER NAME is mandatory.");
        return;
    }

    // Mostrar editor
    $("#seasonalityEditor").show();

    // Inicializar valores 100/12
    let defaultValue = (100 / 12).toFixed(2);

    $(".perc-input").each(function () {
        $(this).val(defaultValue);
    });

    calculateTotal();
});


$(document).on("input", ".perc-input", function () {
    calculateTotal();
});

function calculateTotal() {

    let total = 0;

    $(".perc-input").each(function () {
        let val = parseFloat($(this).val());
        if (!isNaN(val)) total += val;
    });

    $("#seasonalityTotal").val(total.toFixed(2));

    if (total !== 100) {
        let diff = (100 - total).toFixed(2);
        $("#seasonalityMessage").text(
            "Total must be 100%. Difference: " + diff
        );
    } else {
        $("#seasonalityMessage").text("");
    }
}

$("#btnSaveSeasonality").on("click", function () {

    let total = parseFloat($("#seasonalityTotal").val());

    if (total !== 100) {
        alert("Seasonality must sum exactly 100%");
        return;
    }

    let data = buildSeasonalityPayload();

    $.ajax({
        url: "/budgettool/export-snowflake/create",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function () {
            alert("Seasonality created successfully");
            $("#seasonalityEditor").hide();
            loadSeasonality();
        },
        error: function () {
            alert("Error saving seasonality");
        }
    });

});

function buildSeasonalityPayload() {

    let months = {};

    $(".perc-input").each(function () {
        months["PERC_" + $(this).data("month")] =
            parseFloat($(this).val()) || 0;
    });

    return {

        FILTER_NAME: $("#filterName").val(),

        COUNTRY: getCheckedValues(".country-check"),
        ILOB: getCheckedValues(".ilob-check"),
        PRINCIPAL_NUMBER: ($("#filterPrincipal").val() || []).join(","),
        SR_NAME: $("#filterSalesManager").val(),
        PM_NAME: $("#filterProductManager").val(),
        ADDRESS_NAME: ($("#filterAddressName").val() || []).join(","),
        ITEM_NUMBER: ($("#filterItemName").val() || []).join(","),
        INCOME_TYPE: $("#filterIncomeType").val(),
        BC: $("#filterBCC").val(),
        BU: $("#filterBU").val(),

        ...months
    };
}

function getCheckedValues(selector) {

    let values = [];

    $(selector + ":checked").each(function () {
        values.push($(this).val());
    });

    return values.length > 0 ? values.join(",") : null;
}

