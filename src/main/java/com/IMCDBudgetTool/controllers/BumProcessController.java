package com.IMCDBudgetTool.controllers;

import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
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
public class BumProcessController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static Logger LOG = LoggerFactory.getLogger(BumProcessController.class);

    @GetMapping("/bumProcess/listPrincipals")
    public ResponseEntity listPrincipals(@RequestParam(value = "company") String _company, @RequestParam(value = "buAgrupada") String buAgrupada, @RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.BUM_Principals_Consult(?,?,?)}", new Object[]{_company, buAgrupada,UBT_LocalADUuser}, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();

                        jsonMap.put("name", resultSet.getString(1));
                        jsonMap.put("id", resultSet.getString(2));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("Error -> ",e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/bumProcess/listCustomerArea")
    public ResponseEntity listCustomerArea(@RequestParam(value = "COU_Id") String COU_Id, @RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.customerArea_List_Consult(?,?)}", new Object[]{COU_Id, UBT_LocalADUuser}, resultSet -> {
                JSONObject jsonMap = new JSONObject();
                jsonMap.put("name", resultSet.getString("name"));
                jsonArray.add(jsonMap);
            });

            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/bumProcess/listBumTradeNameReported")
    public ResponseEntity listBumTradeNameReported(@RequestParam(value = "COU_ID") String COU_ID,@RequestParam(value = "BU_AGRUPADA") String buAgrupada) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.Bum_TradeName_List_Consult(?,?)}", new Object[]{COU_ID,buAgrupada}, resultSet -> {
                JSONObject jsonMap = new JSONObject();
                jsonMap.put("name", resultSet.getString("name"));
                jsonMap.put("id", resultSet.getString("id"));
                jsonArray.add(jsonMap);
            });

            return new ResponseEntity<Object>(jsonArray, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/bumProcess/getBumTradeNameReported")
    public ResponseEntity getBumTradeNameReported(@RequestParam(value = "productFullSegmentNumber") String productFullSegmentNumber, @RequestParam(value = "BU_AGRUPADA") String buAgrupada, @RequestParam(value = "COU_ID") String couID) {
        try {
            JSONObject jsonMap = new JSONObject();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.Bum_TradeName_Consult(?,?,?)}", new Object[]{productFullSegmentNumber,buAgrupada, couID}, resultSet -> {
                ResultSetMetaData metaData = resultSet.getMetaData();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    jsonMap.put(metaData.getColumnLabel(i), resultSet.getString(i));
                }
            });

            return new ResponseEntity<Object>(jsonMap, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/bumProcess/getBumCustomerAreaReported")
    public ResponseEntity getBumCustomerAreaReported(@RequestParam(value = "COU_ID") String COU_ID, @RequestParam(value = "principal") String principal, @RequestParam(value = "productFullSegmentNumber") String productFullSegmentNumber, @RequestParam(value = "buAgrupada") String buAgrupada) {
        try {
            JSONArray jsonArray = new JSONArray();

            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.CustomerArea_Consult(?,?,?,?)}", new Object[]{COU_ID, principal, productFullSegmentNumber,buAgrupada}, resultSet -> {
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


    @PostMapping("/bumProcess/saveBumTradeArea")
    @ResponseBody
    public ResponseEntity insertBumTradeArea(@RequestParam(value = "COU_Id") String COU_Id, @RequestParam(value = "PRINCIPAL_ERP_NUMBER") String PRINCIPAL_ERP_NUMBER, @RequestParam(value = "PRODUCT_FULL_SEGMENT_NUMBER") String PRODUCT_FULL_SEGMENT_NUMBER, @RequestParam(value = "UBT_LocalADUuser") String UBT_LocalADUuser, @RequestParam(value = "QTY_ROY") String QTY_ROY, @RequestParam(value = "INV_ROY") String INV_ROY, @RequestParam(value = "GM_ROY") String GM_ROY, @RequestParam(value = "GM_ROYPERC") String GM_ROYPERC, @RequestParam(value = "QTY_BDG") String QTY_BDG, @RequestParam(value = "INV_BDG") String INV_BDG, @RequestParam(value = "GM_BDG") String GM_BDG, @RequestParam(value = "GM_BDGPERC") String GM_BDGPERC, @RequestParam(value = "ACTION") String action, @RequestParam(value = "Comments") String Comments) {
        try {

            List prmtrsList = new ArrayList();
            prmtrsList.add(new SqlParameter("COU_ID", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("PRINCIPAL_ERP_NUMBER", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("PRODUCT_FULL_SEGMENT_NUMBER", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("UBT_LocalADUuser", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("QTY_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("INV_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_ROY", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_ROYPERC", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("INV_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_BDG", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_BDGPERC", Types.FLOAT));
            prmtrsList.add(new SqlParameter("Comments", Types.VARCHAR));

            Map<String, Object> resultData = jdbcTemplate.call(connection -> {
                String procedure = (action.equals("insert") ? "Bum_TradeName_Insert" : "Bum_TradeName_Update");
                CallableStatement callableStatement = connection.prepareCall("{call " + procedure + "(?,?,?,?,?,?,?,?,?,?,?,?,?)}");
                callableStatement.setString("COU_ID", COU_Id);
                callableStatement.setString("PRINCIPAL_ERP_NUMBER", PRINCIPAL_ERP_NUMBER);
                callableStatement.setString("PRODUCT_FULL_SEGMENT_NUMBER", PRODUCT_FULL_SEGMENT_NUMBER);
                callableStatement.setString("UBT_LocalADUuser", UBT_LocalADUuser);
                callableStatement.setString("QTY_ROY", QTY_ROY);
                callableStatement.setString("INV_ROY", INV_ROY);
                callableStatement.setString("GM_ROY", GM_ROY);
                callableStatement.setString("GM_ROYPERC", GM_ROYPERC);
                callableStatement.setString("QTY_BDG", QTY_BDG);
                callableStatement.setString("INV_BDG", INV_BDG);
                callableStatement.setString("GM_BDG", GM_BDG);
                callableStatement.setString("GM_BDGPERC", GM_BDGPERC);
                callableStatement.setString("Comments", Comments);
                return callableStatement;
            }, prmtrsList);

            return new ResponseEntity<Object>(

                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PostMapping("/bumProcess/saveCustomerArea")
    @ResponseBody
    public ResponseEntity insertBumCustomerArea(@RequestParam(value = "items", required = true) String items) {
        try {

            List prmtrsList = new ArrayList();
            prmtrsList.add(new SqlParameter("COU_ID", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("PRINCIPAL_ERP_NUMBER", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("PRODUCT_FULL_SEGMENT_NUMBER", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("ALPHA_NAME", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("UBT_LocalADUuser", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("ROY_PERC_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("BDG_PERC_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_ROY_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("INV_ROY_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_ROY_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_ROYPERC_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("QTY_BDG_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("INV_BDG_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_BDG_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("GM_BDGPERC_CA", Types.FLOAT));
            prmtrsList.add(new SqlParameter("Comments", Types.VARCHAR));

            org.codehaus.jettison.json.JSONArray jsonArrayItems = new org.codehaus.jettison.json.JSONArray(items);

            Map<String, String> primaryKeys = new HashMap<>();

            Map<String, Map<String, String>> mapValues = new HashMap<>();

            for (int i = 0; i < jsonArrayItems.length(); i++) {
                org.codehaus.jettison.json.JSONObject jsonObject = jsonArrayItems.getJSONObject(i);

                Map<String, String> map = new HashMap<>();
                String key = (String) jsonObject.keys().next();
                if (key.contains("/")) {
                    String[] keyArr = key.split("/");
                    String campo = keyArr[0];
                    String alphaName = keyArr[1];
                    if (mapValues.get(alphaName) != null) {
                        mapValues.get(alphaName).put(campo, jsonObject.getString(key));
                    } else {
                        map.put(campo, jsonObject.getString(key));
                        mapValues.put(alphaName, map);
                    }
                } else {
                    if (!key.equals("ACTION") && !key.startsWith("TOTAL"))
                        primaryKeys.put(key, jsonObject.getString(key));
                }
            }

            for (Map.Entry<String, Map<String, String>> entry : mapValues.entrySet()) {
                entry.getValue().putAll(primaryKeys);
            }

            for (Map.Entry<String, Map<String, String>> entry : mapValues.entrySet()) {
                Map<String, Object> resultData = jdbcTemplate.call(connection -> {
                    CallableStatement callableStatement = connection.prepareCall("{call Bum_CustomerArea_Insert(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)}");
                    callableStatement.setString("ALPHA_NAME", entry.getKey());
                    for (Map.Entry<String, String> entryMap : entry.getValue().entrySet()) {
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




}
