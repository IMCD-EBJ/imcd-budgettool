package com.IMCDBudgetTool.controllers;

import com.IMCDBudgetTool.services.DelegationService;
import com.IMCDBudgetTool.services.PmProcessService;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PmProcessController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PmProcessService pmProcessService;

    @Autowired
    private DelegationService delegationService;

    private static Logger LOG = LoggerFactory.getLogger(PmProcessController.class);

    @GetMapping("/pmProcess/listPrincipal")
    public ResponseEntity listPrincipalPmProcess(@RequestParam(value = "COU_ID") String COU_ID,
                                                 @RequestParam(value = "BU_AGRUPADA") String buAgrupada,
                                                 @RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                                 @RequestParam(value = "checked") String checked,
                                                 @RequestParam(value = "ROL") String rol) {
        try {
            JSONArray jsonArray = new JSONArray();
            if (rol.equals("MM")) {

                String usersDelegation = delegationService.getUsersDelegationString(UBT_LocalADUuser, "pm_process", "");
                jdbcTemplate.setResultsMapCaseInsensitive(true);
                jdbcTemplate.query("{call dbo.PM_Principals_Consult(?,?,?,?,?)}", new Object[]{COU_ID, "", UBT_LocalADUuser, checked, rol}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonMap.put("id", resultSet.getString("id"));
                    jsonArray.add(jsonMap);
                });
            } else {
                jdbcTemplate.setResultsMapCaseInsensitive(true);
                jdbcTemplate.query("{call dbo.PM_Principals_Consult(?,?,?,?,?)}", new Object[]{COU_ID, buAgrupada, UBT_LocalADUuser, checked, rol}, resultSet -> {
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


    @GetMapping("/pmProcess/listPrincipalReportingLine")
    public ResponseEntity listPrincipalReportingLine(@RequestParam(value = "COU_ID") String COU_ID,
                                                     @RequestParam(value = "BU_AGRUPADA") String buAgrupada,
                                                     @RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                                     @RequestParam(value = "PRINCIPAL_ERP_NUMBER") String principal,
                                                     @RequestParam(value = "checked") String checked,
                                                     @RequestParam(value = "ROL") String rol) {
        try {
            JSONArray jsonArray = new JSONArray();
            if (rol.equals("MM")) {
                String usersDelegation = delegationService.getUsersDelegationString(UBT_LocalADUuser, "pm_process", "");
                jdbcTemplate.query("{call dbo.PM_Principals_Repline_List_Consult(?,?,?,?,?,?)}", new Object[]{COU_ID, "", UBT_LocalADUuser, principal, checked, rol}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonArray.add(jsonMap);
                });
            } else {
                jdbcTemplate.setResultsMapCaseInsensitive(true);
                jdbcTemplate.query("{call dbo.PM_Principals_Repline_List_Consult(?,?,?,?,?,?)}", new Object[]{COU_ID, buAgrupada, UBT_LocalADUuser, principal, checked, rol}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonArray.add(jsonMap);
                });
            }
            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/pmProcess/getActualStatus")
    public ResponseEntity getActualStatus(@RequestParam(value = "COU_ID") String COU_ID,
                                          @RequestParam(value = "BU_AGRUPADA") String buAgrupada,
                                          @RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                          @RequestParam(value = "ROL") String rol) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            if (rol.equals("PM")) {
                jdbcTemplate.query("{call dbo.PM_Principals_Actual_Status(?,?,?)}", new Object[]{COU_ID, buAgrupada, UBT_LocalADUuser}, resultSet -> {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("name", resultSet.getString("name"));
                    jsonMap.put("checked", resultSet.getString("checked"));
                    jsonMap.put("totalReportingline", resultSet.getString("total_reporting_line"));
                    jsonArray.add(jsonMap);
                });
            } else {
                JSONArray arrayDelegatedList = delegationService.getDelegationUsers(UBT_LocalADUuser, "pm_process", (rol.equals("BUM")) ? buAgrupada : "");
                arrayDelegatedList.forEach(userDelegated -> {
                    JSONObject jsonUserDelegated = (JSONObject) userDelegated;
                    String userDelegatedString = jsonUserDelegated.get("localAdUser").toString();
                    String userDelegatedName = jsonUserDelegated.get("name").toString();
                    JSONObject jsonMap = new JSONObject();
                    JSONArray principalsReportingLine = new JSONArray();
                    jdbcTemplate.query("{call dbo.PM_Principals_Actual_Status(?,?,?)}", new Object[]{COU_ID, (rol.equals("BUM")) ? buAgrupada : "", userDelegatedString}, resultSet -> {
                        JSONObject jsonMapInner = new JSONObject();
                        jsonMapInner.put("name", resultSet.getString("name"));
                        jsonMapInner.put("checked", resultSet.getString("checked"));
                        jsonMapInner.put("totalReportingline", resultSet.getString("total_reporting_line"));
                        principalsReportingLine.add(jsonMapInner);
                    });
                    jsonMap.put("totalPrincipals", principalsReportingLine.size());
                    jsonMap.put("pmName", userDelegatedName);
                    jsonMap.put("principals", principalsReportingLine);
                    jsonArray.add(jsonMap);
                });


            }


            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/pmProcess/consultPrincipalReportingLine")
    public ResponseEntity consultPrincipalReportingLine(@RequestParam(value = "COU_ID") String COU_ID,
                                                        @RequestParam(value = "BU_AGRUPADA") String buAgrupada,
                                                        @RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                                        @RequestParam(value = "PRINCIPAL_ERP_NUMBER") String principal,
                                                        @RequestParam(value = "REPORTING_LINE") String reportingLine,
                                                        @RequestParam(value = "ROL") String rol) {
        try {

            JSONObject jsonMap = new JSONObject();

            if (rol.equals("MM")) {
                String usersDelegation = delegationService.getUsersDelegationString(UBT_LocalADUuser, "pm_process", "");
                jdbcTemplate.query("{call dbo.PM_Principals_Repline_Consult(?,?,?,?,?,?)}", new Object[]{COU_ID, "", UBT_LocalADUuser, principal, reportingLine, rol}, resultSet -> {
                    ResultSetMetaData metaData = resultSet.getMetaData();
                    for (int i = 1; i <= metaData.getColumnCount(); i++) {
                        jsonMap.put(metaData.getColumnLabel(i), resultSet.getString(i));
                    }
                });
            } else {
                jdbcTemplate.setResultsMapCaseInsensitive(true);
                jdbcTemplate.query("{call dbo.PM_Principals_Repline_Consult(?,?,?,?,?,?)}", new Object[]{COU_ID, buAgrupada, UBT_LocalADUuser, principal, reportingLine, rol}, resultSet -> {
                    ResultSetMetaData metaData = resultSet.getMetaData();
                    for (int i = 1; i <= metaData.getColumnCount(); i++) {
                        jsonMap.put(metaData.getColumnLabel(i), resultSet.getString(i));
                    }
                });
            }


            return new ResponseEntity<Object>(jsonMap, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/pmProcess/consultPrincipalReportingLineGroupedByPrincipal")
    public ResponseEntity consultReportingLineGroupedByPrincipal(@RequestParam(value = "COU_ID") String COU_ID,
                                                                 @RequestParam(value = "BU_AGRUPADA") String buAgrupada,
                                                                 @RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                                                 @RequestParam(value = "PRINCIPAL_ERP_NUMBER") String principal,
                                                                 @RequestParam(value = "ROL") String rol) {
        try {

            JSONObject jsonMap = new JSONObject();
            if (rol.equals("MM")) {
                String usersDelegation = delegationService.getUsersDelegationString(UBT_LocalADUuser, "pm_process", "");
                jdbcTemplate.query("{call dbo.PM_Reporting_Line_GroupedBy_Principal_Consult(?,?,?,?,?)}", new Object[]{COU_ID, "", UBT_LocalADUuser, principal, rol}, resultSet -> {
                    ResultSetMetaData metaData = resultSet.getMetaData();
                    for (int i = 1; i <= metaData.getColumnCount(); i++) {
                        jsonMap.put(metaData.getColumnLabel(i), resultSet.getString(i));
                    }
                });
            } else {
                jdbcTemplate.setResultsMapCaseInsensitive(true);
                jdbcTemplate.query("{call dbo.PM_Reporting_Line_GroupedBy_Principal_Consult(?,?,?,?,?)}", new Object[]{COU_ID, buAgrupada, UBT_LocalADUuser, principal, rol}, resultSet -> {
                    ResultSetMetaData metaData = resultSet.getMetaData();
                    for (int i = 1; i <= metaData.getColumnCount(); i++) {
                        jsonMap.put(metaData.getColumnLabel(i), resultSet.getString(i));
                    }
                });
            }


            return new ResponseEntity<Object>(jsonMap, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/pmProcess/saveReportingLine")
    @ResponseBody
    public ResponseEntity updatePMReportingLine(@RequestParam(value = "items", required = true) String items) {
        try {

            List prmtrsList = pmProcessService.getListParametros();

            Map<String, String> relacionCampos = pmProcessService.getPmProcessCampos();

            org.codehaus.jettison.json.JSONArray jsonArrayItems = new org.codehaus.jettison.json.JSONArray(items);

            Map<String, String> mapValues = new HashMap<>();

            for (int i = 0; i < jsonArrayItems.length(); i++) {
                org.codehaus.jettison.json.JSONObject jsonObject = jsonArrayItems.getJSONObject(i);
                String key = (String) jsonObject.keys().next();
                if (relacionCampos.containsKey(key)) {
                    mapValues.put(relacionCampos.get(key), jsonObject.getString(key));
                } else {
                    mapValues.put(key, jsonObject.getString(key));
                }
            }

            Map<String, Object> resultData = jdbcTemplate.call(connection -> {
                CallableStatement callableStatement = connection.prepareCall("{call PM_process_Update(" +
                        "?,?,?,?,?,?,?,?,?,?,?," +
                        "?,?,?,?,?,?,?,?,?,?,?," +
                        "?,?,?,?,?,?,?,?,?,?,?," +
                        "?,?,?)}");
                for (Map.Entry<String, String> entryMap : mapValues.entrySet()) {
                    callableStatement.setString(entryMap.getKey(), entryMap.getValue());
                }
                return callableStatement;
            }, prmtrsList);


            return new ResponseEntity<Object>(
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/pmProcess/consultPrincipalReportingLineProducts")
    public ResponseEntity consultPrincipalReportingLineProducts(@RequestParam(value = "COU_ID") String COU_ID,
                                                                @RequestParam(value = "BU_AGRUPADA") String buAgrupada,
                                                                @RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser,
                                                                @RequestParam(value = "PRINCIPAL_ERP_NUMBER") String principal,
                                                                @RequestParam(value = "REPORTING_LINE") String reportingLine,
                                                                @RequestParam(value = "LOST") String lost,
                                                                @RequestParam(value = "ROL") String rol) {
        try {

            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.PM_Principals_Repline_Products_Lost_Consult(?,?,?,?,?,?,?)}", new Object[]{COU_ID, buAgrupada, UBT_LocalADUuser, principal, reportingLine, lost, rol}, resultSet -> {
                JSONObject jsonMap = new JSONObject();
                ResultSetMetaData metaData = resultSet.getMetaData();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    jsonMap.put(metaData.getColumnLabel(i), resultSet.getString(i));
                }
                jsonArray.add(jsonMap);
            });

            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            //LOG.error("ERROR -> ", e);
            //return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
            return new ResponseEntity<Object>("", HttpStatus.OK);
        }
    }


    @PostMapping("/pmProcess/saveLostProducts")
    @ResponseBody
    public ResponseEntity saveLostProducts(@RequestParam(value = "items", required = true) String items) {
        try {

            List prmtrsListInsert = new ArrayList();
            List prmtrsListDelete = new ArrayList();
            prmtrsListInsert.add(new SqlParameter("COU_Id", Types.VARCHAR));
            prmtrsListInsert.add(new SqlParameter("BU_Agrupada", Types.VARCHAR));
            prmtrsListInsert.add(new SqlParameter("UBT_LocalADUuser", Types.VARCHAR));
            prmtrsListInsert.add(new SqlParameter("PRINCIPAL_ERP_NUMBER", Types.VARCHAR));
            prmtrsListInsert.add(new SqlParameter("PRINCIPAL_REPORTING_LINE", Types.VARCHAR));
            prmtrsListInsert.add(new SqlParameter("PRODUCT_NAME", Types.VARCHAR));
            prmtrsListInsert.add(new SqlParameter("MONTH", Types.VARCHAR));
            prmtrsListInsert.add(new SqlParameter("COMMENTS", Types.VARCHAR));


            prmtrsListDelete.add(new SqlParameter("COU_Id", Types.VARCHAR));
            prmtrsListDelete.add(new SqlParameter("BU_Agrupada", Types.VARCHAR));
            prmtrsListDelete.add(new SqlParameter("UBT_LocalADUuser", Types.VARCHAR));
            prmtrsListDelete.add(new SqlParameter("PRINCIPAL_ERP_NUMBER", Types.VARCHAR));
            prmtrsListDelete.add(new SqlParameter("PRINCIPAL_REPORTING_LINE", Types.VARCHAR));

            org.codehaus.jettison.json.JSONArray jsonArrayItems = new org.codehaus.jettison.json.JSONArray(items);

            Map<String, String> mapValues = new HashMap<>();
            List<Map<String, String>> listProducts = new ArrayList<>();
            for (int i = 0; i < jsonArrayItems.length(); i++) {
                org.codehaus.jettison.json.JSONObject jsonObject = jsonArrayItems.getJSONObject(i);

                String key = (String) jsonObject.keys().next();
                if (key.equals("PRODUCTS")) {
                    org.codehaus.jettison.json.JSONArray jsonArrayProducts = jsonObject.getJSONArray("PRODUCTS");
                    for (int j = 0; j < jsonArrayProducts.length(); j++) {
                        org.codehaus.jettison.json.JSONObject product = jsonArrayProducts.getJSONObject(j);
                        Map<String, String> mapProduct = new HashMap<>();
                        product.keys().forEachRemaining(keyObjectProduct -> {
                            if (!((String) keyObjectProduct).isEmpty()) {
                                try {
                                    mapProduct.put((String) keyObjectProduct, product.getString((String) keyObjectProduct));
                                } catch (JSONException e) {
                                    throw new RuntimeException(e);
                                }
                            }
                        });
                        listProducts.add(mapProduct);
                    }
                } else {
                    mapValues.put(key, jsonObject.getString(key));
                }
            }

            Map<String, Object> resultDataDelete = jdbcTemplate.call(connection -> {
                CallableStatement callableStatement = connection.prepareCall("{call PM_Principals_Repline_Products_Lost_Delete(" +
                        "?,?,?,?,?)}");
                for (Map.Entry<String, String> entryMap : mapValues.entrySet()) {
                    if (!entryMap.getKey().equals("MONTH") && !entryMap.getKey().equals("COMMENTS"))
                        callableStatement.setString(entryMap.getKey(), entryMap.getValue());
                }
                return callableStatement;
            }, prmtrsListDelete);


            if (listProducts.size() > 0) {
                for (Map<String, String> listProduct : listProducts) {
                    listProduct.put("COMMENTS", "");
                }
                for (Map<String, String> product : listProducts) {
                    Map<String, Object> resultData = jdbcTemplate.call(connection -> {
                        CallableStatement callableStatement = connection.prepareCall("{call PM_Principals_Repline_Products_Lost_Insert(" +
                                "?,?,?,?,?,?,?,?)}");
                        for (Map.Entry<String, String> entryMap : product.entrySet()) {
                            callableStatement.setString(entryMap.getKey(), entryMap.getValue());
                        }
                        for (Map.Entry<String, String> entryMap : mapValues.entrySet()) {
                            callableStatement.setString(entryMap.getKey(), entryMap.getValue());
                        }
                        return callableStatement;
                    }, prmtrsListInsert);
                }
            } else {
                if (mapValues.containsKey("MONTH")) {
                    Map<String, Object> resultData = jdbcTemplate.call(connection -> {
                        CallableStatement callableStatement = connection.prepareCall("{call PM_Principals_Repline_Products_Lost_Insert(" +
                                "?,?,?,?,?,?,?,?)}");
                        for (Map.Entry<String, String> entryMap : mapValues.entrySet()) {
                            callableStatement.setString(entryMap.getKey(), entryMap.getValue());
                        }
                        callableStatement.setString("PRODUCT_NAME", "");
                        return callableStatement;
                    }, prmtrsListInsert);
                }
            }


            return new ResponseEntity<Object>(
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
