package com.IMCDBudgetTool.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/adj")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AdjProcessController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /* ============================================================
       DATA (DETALLE + COUNT + TOTALES)
    ============================================================ */

    @GetMapping("/data")
    public Map<String, Object> getData(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String principal_number,
            @RequestParam(required = false) String sr_name,
            @RequestParam(required = false) String pm_name,
            @RequestParam(required = false) String address_name,
            @RequestParam(required = false) String item_number,
            @RequestParam(required = false) String income_type,
            @RequestParam(required = false) String bc,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "25") int pageSize
    ) {

        String countryParam   = emptyToNull(country);
        String principalParam = emptyToNull(principal_number);
        String srParam        = emptyToNull(sr_name);
        String pmParam        = emptyToNull(pm_name);
        String addressParam   = emptyToNull(address_name);
        String itemParam      = emptyToNull(item_number);
        String incomeParam    = emptyToNull(income_type);
        Integer bcParam       = (bc == null || bc.trim().isEmpty()) ? null : Integer.valueOf(bc);

        List<Map<String, Object>> detail =
                jdbcTemplate.queryForList(
                        "{call SR_Process_Filter_Consult(?,?,?,?,?,?,?,?,?,?)}",
                        countryParam,
                        principalParam,
                        srParam,
                        pmParam,
                        addressParam,
                        itemParam,
                        incomeParam,
                        bcParam,
                        page,
                        pageSize
                );

        List<Map<String, Object>> countResult =
                jdbcTemplate.queryForList(
                        "{call SR_Process_Count(?,?,?,?,?,?,?,?)}",
                        countryParam,
                        principalParam,
                        srParam,
                        pmParam,
                        addressParam,
                        itemParam,
                        incomeParam,
                        bcParam
                );

        int totalRows = 0;
        if (!countResult.isEmpty()) {
            totalRows = ((Number) countResult.get(0).get("TotalRows")).intValue();
        }

        List<Map<String, Object>> totals =
                jdbcTemplate.queryForList(
                        "{call SR_Process_Get_Totals(?,?,?,?,?,?,?,?)}",
                        countryParam,
                        principalParam,
                        srParam,
                        pmParam,
                        addressParam,
                        itemParam,
                        incomeParam,
                        bcParam
                );

        Map<String, Object> response = new HashMap<>();
        response.put("detail", detail);
        response.put("totals", totals);
        response.put("totalRows", totalRows);

        return response;
    }


    /* ============================================================
       SOLO DETALLE
    ============================================================ */

    @GetMapping("/filter")
    public Map<String, Object> filter(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String principal_number,
            @RequestParam(required = false) String sr_name,
            @RequestParam(required = false) String pm_name,
            @RequestParam(required = false) String address_name,
            @RequestParam(required = false) String item_number,
            @RequestParam(required = false) String income_type,
            @RequestParam(required = false) String bc,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "25") int pageSize
    ) {

        System.out.println("=== /adj/filter ===");

        try {

            List<Map<String, Object>> data =
                    jdbcTemplate.queryForList(
                            "EXEC SR_Process_Filter_Consult ?,?,?,?,?,?,?,?,?",
                            emptyToNull(country),
                            emptyToNull(principal_number),
                            emptyToNull(sr_name),
                            emptyToNull(pm_name),
                            emptyToNull(address_name),
                            emptyToNull(item_number),
                            emptyToNull(income_type),
                            (bc == null || bc.trim().isEmpty()) ? null : Integer.valueOf(bc),
                            page,
                            pageSize
                    );

            Map<String, Object> response = new HashMap<>();
            response.put("data", data);

            System.out.println("✔ filter rows=" + data.size());

            return response;

        } catch (Exception e) {
            System.out.println("❌ ERROR in /adj/filter");
            e.printStackTrace();
            throw e;
        }
    }

    /* ============================================================
       SOLO TOTALES
    ============================================================ */

    @GetMapping("/totals")
    public List<Map<String, Object>> totals(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String principal_number,
            @RequestParam(required = false) String sr_name,
            @RequestParam(required = false) String pm_name,
            @RequestParam(required = false) String address_name,
            @RequestParam(required = false) String item_number,
            @RequestParam(required = false) String income_type,
            @RequestParam(required = false) String bc
    ) {

        System.out.println("=== /adj/totals ===");

        try {

            List<Map<String, Object>> result =
                    jdbcTemplate.queryForList(
                            "EXEC SR_Process_Get_Totals ?,?,?,?,?,?,?,?",
                            emptyToNull(country),
                            emptyToNull(principal_number),
                            emptyToNull(sr_name),
                            emptyToNull(pm_name),
                            emptyToNull(address_name),
                            emptyToNull(item_number),
                            emptyToNull(income_type),
                            (bc == null || bc.trim().isEmpty()) ? null : Integer.valueOf(bc)
                    );

            System.out.println("✔ totals rows=" + result.size());

            return result;

        } catch (Exception e) {
            System.out.println("❌ ERROR in /adj/totals");
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/items-search")
    public List<Map<String, Object>> searchItems(
            @RequestParam(required = false) String search
    ) {

        System.out.println("=== /adj/items-search search=" + search + " ===");

        return jdbcTemplate.queryForList(
                "EXEC SRP_Filter_Search_Items ?",
                emptyToNull(search)
        );
    }


    @GetMapping("/address-search")
    public List<Map<String, Object>> searchAddress(
            @RequestParam(required = false) String search
    ) {

        System.out.println("=== /adj/address-search search=" + search + " ===");

        return jdbcTemplate.queryForList(
                "EXEC SRP_Filter_Search_Address ?",
                emptyToNull(search)
        );
    }

    @GetMapping("/principals-search")
    public List<Map<String, Object>> searchPrincipals(
            @RequestParam(required = false) String search
    ) {

        System.out.println("=== /adj/principals-search search=" + search + " ===");

        return jdbcTemplate.queryForList(
                "EXEC SRP_Filter_Search_Principals ?",
                emptyToNull(search)
        );
    }


    /* ============================================================
       COMBOS
    ============================================================ */

    @GetMapping("/principals")
    public List<Map<String, Object>> getPrincipals() {
        System.out.println("=== /adj/principals ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_Principals");
    }

    @GetMapping("/sr")
    public List<Map<String, Object>> getSR() {
        System.out.println("=== /adj/sr ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_SR");
    }

    @GetMapping("/pm")
    public List<Map<String, Object>> getPM() {
        System.out.println("=== /adj/pm ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_PM");
    }

    @GetMapping("/income-type")
    public List<Map<String, Object>> getIncomeType() {
        System.out.println("=== /adj/income-type ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_IncomeType");
    }

    @GetMapping("/business-type")
    public List<Map<String, Object>> getBusinessType() {

        System.out.println("=== /adj/business-type ===");

        return jdbcTemplate.queryForList(
                "EXEC SRP_Filter_Get_BusinessType"
        );
    }

    @GetMapping("/address")
    public List<Map<String, Object>> getAddress() {
        System.out.println("=== /adj/address ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_Address");
    }

    @GetMapping("/items")
    public List<Map<String, Object>> getItems() {
        System.out.println("=== /adj/items ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_Items");
    }

    @GetMapping("/ilob")
    public List<Map<String, Object>> getIlob() {
        System.out.println("=== /adj/ilob ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_ILOB");
    }

    @GetMapping("/bu")
    public List<Map<String, Object>> getBU(
            @RequestParam(required = false) String country
    ) {

        System.out.println("=== /adj/bu country=" + country + " ===");

        return jdbcTemplate.queryForList(
                "EXEC SR_Process_Get_BU ?",
                emptyToNull(country)
        );
    }


    @GetMapping("/bc")
    public List<Map<String, Object>> getBC() {
        System.out.println("=== /adj/bc ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_BC");
    }


    /* ============================================================
       UTIL
    ============================================================ */

    private String emptyToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value;
    }


}
