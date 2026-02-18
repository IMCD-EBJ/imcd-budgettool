package com.IMCDBudgetTool.controllers;

import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/export-snowflake")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ExportSnowflakeController
{


    private static final Logger LOG =
            LoggerFactory.getLogger(ExportSnowflakeController.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;



    @GetMapping("/items-search")
    public List<Map<String, Object>> searchItems(
            @RequestParam(required = false) String search
    ) {

        System.out.println("=== /export-snowflake/items-search search=" + search + " ===");

        return jdbcTemplate.queryForList(
                "EXEC SRP_Filter_Search_Items ?",
                emptyToNull(search)
        );
    }

    @GetMapping("/address-search")
    public List<Map<String, Object>> searchAddress(
            @RequestParam(required = false) String search
    ) {

        System.out.println("=== /export-snowflake/address-search search=" + search + " ===");

        return jdbcTemplate.queryForList(
                "EXEC SRP_Filter_Search_Address ?",
                emptyToNull(search)
        );
    }

    @GetMapping("/principals-search")
    public List<Map<String, Object>> searchPrincipals(
            @RequestParam(required = false) String search
    ) {

        System.out.println("=== /export-snowflake/principals-search search=" + search + " ===");

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
        System.out.println("=== /export-snowflake/principals ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_Principals");
    }

    @GetMapping("/sr")
    public List<Map<String, Object>> getSR() {
        System.out.println("=== /export-snowflake/sr ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_SR");
    }

    @GetMapping("/pm")
    public List<Map<String, Object>> getPM() {
        System.out.println("=== /export-snowflake/pm ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_PM");
    }

    @GetMapping("/income-type")
    public List<Map<String, Object>> getIncomeType() {
        System.out.println("=== /export-snowflake/income-type ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_IncomeType");
    }

    @GetMapping("/business-type")
    public List<Map<String, Object>> getBusinessType() {

        System.out.println("=== /export-snowflake/business-type ===");

        return jdbcTemplate.queryForList(
                "EXEC SRP_Filter_Get_BusinessType"
        );
    }

    @GetMapping("/address")
    public List<Map<String, Object>> getAddress() {
        System.out.println("=== /export-snowflake/address ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_Address");
    }

    @GetMapping("/items")
    public List<Map<String, Object>> getItems() {
        System.out.println("=== /export-snowflake/items ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_Items");
    }

    @GetMapping("/ilob")
    public List<Map<String, Object>> getIlob() {
        System.out.println("=== /export-snowflake/ilob ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_ILOB");
    }

    @GetMapping("/bu")
    public List<Map<String, Object>> getBU(
            @RequestParam(required = false) String country
    ) {

        System.out.println("=== /export-snowflake/bu country=" + country + " ===");

        return jdbcTemplate.queryForList(
                "EXEC SR_Process_Get_BU ?",
                emptyToNull(country)
        );
    }

    @GetMapping("/bc")
    public List<Map<String, Object>> getBC() {
        System.out.println("=== /export-snowflake/bc ===");
        return jdbcTemplate.queryForList("EXEC SRP_Filter_Get_BC");
    }

    /* ============================================================
       UTIL
    ============================================================ */

    private String emptyToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value;
    }

    private String emptyToNull(Object value) {

        if (value == null) return null;

        String str = value.toString().trim();

        return str.isEmpty() ? null : str;
    }

    private Integer toIntegerOrNull(Object value) {

        if (value == null) return null;

        String str = value.toString().trim();

        if (str.isEmpty()) return null;

        return Integer.valueOf(str);
    }

    private Double toDecimal(Object value) {

        if (value == null) return 0.0;

        return Double.valueOf(value.toString());
    }


    /* =====================================================
       LIST (SEASONALITY)
    ====================================================== */

    @GetMapping("/list")
    public ResponseEntity<?> list(@RequestParam int page,
                                  @RequestParam int pageSize) {

        try {

            Map<String, Object> result = new HashMap<>();

            List<Map<String, Object>> data =
                    jdbcTemplate.queryForList(
                            "EXEC dbo.SRP_SeasonalityFilter_List ?, ?",
                            page,
                            pageSize
                    );

            Integer totalRows =
                    jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM dbo.SRP_SEASONALITY_FILTER",
                            Integer.class
                    );

            result.put("data", data);
            result.put("totalRows", totalRows);

            return new ResponseEntity<>(result, HttpStatus.OK);

        } catch (Exception e) {
            LOG.error("ERROR list -> ", e);
            return new ResponseEntity<>("Error BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PostMapping("/move")
    public ResponseEntity<?> move(@RequestParam int seasonalityId,
                                  @RequestParam String direction) {
        try {
            jdbcTemplate.update("EXEC SRP_SeasonalityFilter_Move ?, ?", seasonalityId, direction);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR move -> ", e);
            return new ResponseEntity<>("Error BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/delete")
    public ResponseEntity<?> delete(@RequestParam int seasonalityId) {
        try {
            jdbcTemplate.update("EXEC SRP_SeasonalityFilter_Delete ?", seasonalityId);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR delete -> ", e);
            return new ResponseEntity<>("Error BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /* =====================================================
       EXPORT
    ====================================================== */

    @PostMapping("/export")
    public ResponseEntity<?> export(@RequestBody Map<String, Object> filters) {
        try {
            // lógica futura de export
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR export -> ", e);
            return new ResponseEntity<>("Error BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> payload) {

        try {

            jdbcTemplate.update(
                    "{call SRP_SeasonalityFilter_Insert(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)}",

                    emptyToNull(payload.get("FILTER_NAME")),
                    emptyToNull(payload.get("COUNTRY")),
                    emptyToNull(payload.get("ILOB")),
                    emptyToNull(payload.get("PRINCIPAL_NUMBER")),
                    emptyToNull(payload.get("SR_NAME")),
                    emptyToNull(payload.get("PM_NAME")),
                    emptyToNull(payload.get("ADDRESS_NAME")),
                    emptyToNull(payload.get("ITEM_NUMBER")),
                    emptyToNull(payload.get("INCOME_TYPE")),
                    toIntegerOrNull(payload.get("BC")),
                    emptyToNull(payload.get("BU")),
                    toDecimal(payload.get("PERC_JAN")),
                    toDecimal(payload.get("PERC_FEB")),
                    toDecimal(payload.get("PERC_MAR")),
                    toDecimal(payload.get("PERC_APR")),
                    toDecimal(payload.get("PERC_MAY")),
                    toDecimal(payload.get("PERC_JUN")),
                    toDecimal(payload.get("PERC_JUL")),
                    toDecimal(payload.get("PERC_AUG")),
                    toDecimal(payload.get("PERC_SEP")),
                    toDecimal(payload.get("PERC_OCT")),
                    toDecimal(payload.get("PERC_NOV")),
                    toDecimal(payload.get("PERC_DEC"))
            );

            return new ResponseEntity<>(HttpStatus.OK);

        } catch (Exception e) {
            LOG.error("ERROR create seasonality -> ", e);
            return new ResponseEntity<>("Error BD: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



}
