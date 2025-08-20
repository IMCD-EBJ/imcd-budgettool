package com.IMCDBudgetTool.controllers;

import com.IMCDBudgetTool.services.DelegationService;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.codehaus.jettison.json.JSONException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.web.bind.annotation.*;
import java.sql.CallableStatement;
import java.sql.ResultSetMetaData;
import java.sql.Types;
import java.util.*;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SrProcessController {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private DelegationService delegationService;

    private static Logger LOG = LoggerFactory.getLogger(SrProcessController.class);

    @GetMapping("/srProcess/listIncomeTypes")
    public ResponseEntity listIncomeTypes(@RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                          @RequestParam(value= "BU_AGRUPADA") String buAgraupada,
                                          @RequestParam(value = "BUSINESS_TYPE") String businessType,
                                          @RequestParam(value = "CHECKED") String checked,
                                          @RequestParam(value = "ROL") String rol) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            if (rol.equals("MM")){
                String usersDelegation = delegationService.getUsersDelegationString(UBT_LocalADUuser, "sr_process", "");
                jdbcTemplate.setResultsMapCaseInsensitive(true);
                //jdbcTemplate.query("{call dbo.SR_Income_Type_List_Consult(?,?,?,?,?)}", new Object[]{usersDelegation,"", businessType, checked,rol}, resultSet -> {
                jdbcTemplate.query("{call dbo.SR_Income_Type_List_Consult(?,?,?,?,?)}", new Object[]{UBT_LocalADUuser,buAgraupada, businessType, checked,rol}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonMap.put("id", resultSet.getString("id"));
                    jsonArray.add(jsonMap);
                });
            }else{

                jdbcTemplate.query("{call dbo.SR_Income_Type_List_Consult(?,?,?,?,?)}", new Object[]{UBT_LocalADUuser,buAgraupada, businessType, checked,rol}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonMap.put("id", resultSet.getString("id"));
                    jsonArray.add(jsonMap);
                });
            }

            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/srProcess/listBusinessTypes")
    public ResponseEntity listBusinessTypes(@RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                            @RequestParam(value= "BU_AGRUPADA") String buAgraupada,
                                            @RequestParam(value = "CHECKED") String checked,
                                            @RequestParam(value = "ROL") String rol) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            if (rol.equals("MM")){
                String usersDelegation = delegationService.getUsersDelegationString(UBT_LocalADUuser, "sr_process", "");
                //jdbcTemplate.query("{call dbo.SR_Business_Type_List_Consult(?,?,?,?)}", new Object[]{usersDelegation, "",checked, rol}, resultSet -> {
                jdbcTemplate.query("{call dbo.SR_Business_Type_List_Consult(?,?,?,?)}", new Object[]{UBT_LocalADUuser, buAgraupada,checked, rol}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonMap.put("id", resultSet.getString("id"));
                    jsonArray.add(jsonMap);
                });
            }else{
                jdbcTemplate.query("{call dbo.SR_Business_Type_List_Consult(?,?,?,?)}", new Object[]{UBT_LocalADUuser, buAgraupada,checked, rol}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonMap.put("id", resultSet.getString("id"));
                    jsonArray.add(jsonMap);
                });
            }



            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/srProcess/listCustomers")
    public ResponseEntity listCustomers(@RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                        @RequestParam(value = "INCOME_TYPE") String incomeType,
                                        @RequestParam(value = "BUSINESS_TYPE") String businessType,
                                        @RequestParam(value= "BU_AGRUPADA") String buAgrupada,
                                        @RequestParam(value = "CHECKED") String checked,
                                        @RequestParam(value = "ROL") String rol,
                                        @RequestParam(value = "TYPE") String type) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            if (rol.equals("MM")){
                String usersDelegation = delegationService.getUsersDelegationString(UBT_LocalADUuser, "sr_process", "");
                //jdbcTemplate.query("{call dbo.SR_Customers_List_Consult(?,?,?,?,?,?)}", new Object[]{usersDelegation, incomeType, businessType, "",checked, rol}, resultSet -> {
                jdbcTemplate.query("{call dbo.SR_Customers_List_Consult(?,?,?,?,?,?,?)}", new Object[]{UBT_LocalADUuser, incomeType, businessType, buAgrupada,checked, rol, type}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonMap.put("id", resultSet.getString("id"));
                    jsonArray.add(jsonMap);
                });
            }else{
                jdbcTemplate.query("{call dbo.SR_Customers_List_Consult(?,?,?,?,?,?,?)}", new Object[]{UBT_LocalADUuser, incomeType, businessType, buAgrupada,checked, rol, type}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonMap.put("id", resultSet.getString("id"));
                    jsonArray.add(jsonMap);
                });
            }


            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/srProcess/getCustomerLines")
    public ResponseEntity getCustomerLines(@RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                           @RequestParam(value = "incomeType") String incomeType,
                                           @RequestParam(value = "businessType") String businessType,
                                           @RequestParam(value = "customer") String customer,
                                           @RequestParam(value = "ROL") String rol,
                                           @RequestParam(value = "CHECKED") String checked,
                                           @RequestParam(value = "TYPE") String type) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);

            jdbcTemplate.query("{call dbo.SR_Customer_Lines_Consult(?,?,?,?,?,?,?)}", new Object[]{UBT_LocalADUuser, incomeType, businessType, customer, rol, checked,type}, resultSet -> {
                JSONObject jsonMap = new JSONObject();
                ResultSetMetaData metaData = resultSet.getMetaData();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    jsonMap.put(metaData.getColumnLabel(i), resultSet.getString(i));
                }
                jsonArray.add(jsonMap);
            });

            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/srProcess/getSelectOptionsBudgetData")
    public ResponseEntity getSelectOptionsBudgetData() {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.SR_Customers_Budget_Data_Select_Options_Consult()}", new Object[]{}, resultSet -> {
                JSONObject jsonMap = new JSONObject();
                jsonMap.put("value", resultSet.getString("value"));
                jsonMap.put("text", resultSet.getString("text"));
                jsonArray.add(jsonMap);
            });
            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/srProcess/saveLines")
    @ResponseBody
    public ResponseEntity saveLines(@RequestParam(value = "items") String items) {
        try {

            List prmtrsList = new ArrayList();


            prmtrsList.add(new SqlParameter("BusinessType", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("COMMENTS", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("CUSTOMER", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("COST_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("COST_FCS", Types.FLOAT));
            prmtrsList.add(new SqlParameter("COST_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_FCS", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_YTD", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GMP_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GMP_BDG_ORIGEN", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GMP_FCS", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GMP_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GMP_ROY_LYR", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GMP_ROY_ORIGEN", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GMP_YTD", Types.FLOAT));
            prmtrsList.add(new SqlParameter("INCOME_TYPE", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("INV_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("INV_FCS", Types.FLOAT));
            prmtrsList.add(new SqlParameter("INV_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("INV_YTD", Types.FLOAT));
            prmtrsList.add(new SqlParameter("ITEM_NUMBER", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("PRINCIPAL_NUMBER", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("QTY_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_BDG_origen", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_FCS", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_LYR", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_ROY_BDG_CY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_ROY_LYR", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_ROY_origen", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_YTD", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_YTD_LYR", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTYOPBDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTYOPROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("UBT_LocalADUuser", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("UNIT_COST_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("UNIT_COST_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("UNIT_MARGIN_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("UNIT_MARGIN_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("UNIT_PRICE_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("UNIT_PRICE_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GMP_YTD_LYR", Types.FLOAT));
            prmtrsList.add(new SqlParameter("VARPERC_QTY_BDG_vs_FCS", Types.FLOAT));
            prmtrsList.add(new SqlParameter("VARPERC_QTY_FCS_vs_LYR", Types.FLOAT));
            prmtrsList.add(new SqlParameter("VARPERC_QTY_YTD_VS_LYR", Types.FLOAT));

            org.codehaus.jettison.json.JSONArray jsonArrayItems = new org.codehaus.jettison.json.JSONArray(items);

            Map<String, String> mapValues = new HashMap<>();
            List<Map<String, String>> listLines = new ArrayList<>();
            for (int i = 0; i < jsonArrayItems.length(); i++) {
                org.codehaus.jettison.json.JSONObject jsonObject = jsonArrayItems.getJSONObject(i);

                String key = (String) jsonObject.keys().next();
                if (key.equals("LINES")) {
                    org.codehaus.jettison.json.JSONArray jsonArrayProducts = jsonObject.getJSONArray("LINES");
                    for (int j = 0; j < jsonArrayProducts.length(); j++) {
                        org.codehaus.jettison.json.JSONObject product = jsonArrayProducts.getJSONObject(j);
                        Map<String, String> mapLines = new HashMap<>();
                        product.keys().forEachRemaining(keyObjectProduct -> {
                            if (!((String) keyObjectProduct).isEmpty()) {
                                try {
                                    mapLines.put((String) keyObjectProduct, product.getString((String) keyObjectProduct));
                                } catch (JSONException e) {
                                    throw new RuntimeException(e);
                                }
                            }
                        });
                        listLines.add(mapLines);
                    }
                } else {
                    mapValues.put(key, jsonObject.getString(key));
                }
            }


            for (Map<String, String> line : listLines) {
                Map<String, Object> resultData = jdbcTemplate.call(connection -> {
                    CallableStatement callableStatement = connection.prepareCall("{call SR_Customer_Lines_Update(" +
                            "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?," +
                            "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?," +
                            "?,?,?,?,?,?,?,?,?,?,?,?,?,?,?," +
                            "?,?)}");
                    for (Map.Entry<String, String> entryMap : line.entrySet()) {
                        callableStatement.setString(entryMap.getKey(), entryMap.getValue());
                    }

                    for (Map.Entry<String, String> entryMap : mapValues.entrySet()) {
                        callableStatement.setString(entryMap.getKey(), entryMap.getValue());
                    }
                    return callableStatement;
                }, prmtrsList);
            }


            return new ResponseEntity<Object>(
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/srProcess/getActualStatus")
    public ResponseEntity getActualStatus(@RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                          @RequestParam(value= "BU_AGRUPADA") String buAgrupada,
                                          @RequestParam(value = "ROL") String rol) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            if (rol.equals("MM")){
                String usersDelegation = delegationService.getUsersDelegationString(UBT_LocalADUuser, "sr_process", "");
                //jdbcTemplate.query("{call dbo.SR_Actual_Status_Consult(?,?,?)}", new Object[]{usersDelegation,"",rol}, resultSet -> {
                jdbcTemplate.query("{call dbo.SR_Actual_Status_Consult(?,?,?)}", new Object[]{UBT_LocalADUuser,buAgrupada,rol}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("title", resultSet.getString(1));
                    jsonMap.put("checked", resultSet.getString("checked"));
                    jsonMap.put("total", resultSet.getString("total"));
                    jsonMap.put("totalCustomers", resultSet.getString("total_customers"));
                    jsonArray.add(jsonMap);
                });
            }else{
                jdbcTemplate.query("{call dbo.SR_Actual_Status_Consult(?,?,?)}", new Object[]{UBT_LocalADUuser,buAgrupada,rol}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("title", resultSet.getString(1));
                    jsonMap.put("checked", resultSet.getString("checked"));
                    jsonMap.put("total", resultSet.getString("total"));
                    jsonMap.put("totalCustomers", resultSet.getString("total_customers"));
                    jsonArray.add(jsonMap);
                });
            }


            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/srProcess/getTotales")
    public ResponseEntity getTotales(@RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                     @RequestParam(value = "customer") String customer,
                                     @RequestParam(value = "TABLE_TYPE") String tableType,
                                     @RequestParam(value= "BU_AGRUPADA") String buAgrupada,
                                     @RequestParam(value = "ROL") String rol) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            String procedureSRTotals = (rol.equals("SR"))? "SR_Totals_SR_Consult(?,?,?)":(rol.equals("MM"))? "SR_Totals_SR_Consult_MM(?,?,?)":"SR_Totals_SR_Consult_BUM(?,?,?,?)";
            Object[] params;
            if (rol.equals("SR") || rol.equals("MM")){
                params = new Object[]{UBT_LocalADUuser, customer, tableType};
            }else{
                params = new Object[]{UBT_LocalADUuser, customer, tableType, buAgrupada};

            }
            JSONArray jsonArraySr = new JSONArray();
            jdbcTemplate.query("{call dbo."+procedureSRTotals+"}", params, resultSet -> {
                JSONObject jsonMap = new JSONObject();
                ResultSetMetaData metaData = resultSet.getMetaData();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    jsonMap.put(metaData.getColumnLabel(i), resultSet.getString(i));
                }
                jsonArraySr.add(jsonMap);
            });

            jsonArray.add(jsonArraySr);
            JSONArray jsonArrayMgm = new JSONArray();
            String procedureMgmtTotals = (rol.equals("SR"))? "SR_Totals_Mgmt_Consult(?,?,?)":(rol.equals("MM"))? "SR_Totals_Mgmt_Consult_MM(?,?,?)":"SR_Totals_Mgmt_Consult_BUM(?,?,?,?)";
            jdbcTemplate.query("{call dbo."+procedureMgmtTotals+"}",params, resultSet -> {
                JSONObject jsonMap = new JSONObject();
                ResultSetMetaData metaData = resultSet.getMetaData();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    jsonMap.put(metaData.getColumnLabel(i), resultSet.getString(i));
                }
                jsonArrayMgm.add(jsonMap);
            });

            jsonArray.add(jsonArrayMgm);

            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }




}
