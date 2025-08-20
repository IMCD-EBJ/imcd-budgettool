package com.IMCDBudgetTool.controllers;

import com.IMCDBudgetTool.data.service.UserService;
import com.IMCDBudgetTool.services.EmailService;
import com.IMCDBudgetTool.services.UtilsService;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.web.bind.annotation.*;

import java.sql.*;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@EnableCaching
public class UtilsController {


    private static Logger LOG = LoggerFactory.getLogger(UtilsController.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UtilsService utilsService;
    @Autowired
    private UserService userService;
    @Autowired
    private EmailService emailService;

    @GetMapping("/utils/listCompany")
    @Cacheable(value = "listCompany")
    public ResponseEntity listCompany() {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.countries_Consult()}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(1));
                        jsonMap.put("name", resultSet.getString(2));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listCompanyByUser")
    public ResponseEntity listCompanyByUser(@RequestParam(value = "UbT_LocalADUuser") String UbT_LocalADUuser) {
        try {
            JSONArray jsonArray = new JSONArray();
            Object[] params = new Object[]{UbT_LocalADUuser};
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.countries_byUser_Consult(?)}",params, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(1));
                        jsonMap.put("name", resultSet.getString(2));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listCurrency")
    @Cacheable(value = "listCurrency")
    public ResponseEntity listCurrency() {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.Currency_consult()}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(3));
                        jsonMap.put("name", resultSet.getString(3));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listYears")
    @Cacheable(value = "listYears")
    public ResponseEntity listYear() {
        try {
            JSONArray jsonArray = new JSONArray();
            int anio = Calendar.getInstance().get(Calendar.YEAR);

            for (int i = anio; i < anio + 5; i++) {
                JSONObject jsonMap = new JSONObject();
                jsonMap.put("id", i);
                jsonMap.put("name", i);
                jsonArray.add(jsonMap);
            }

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listPeriod")
    @Cacheable(value = "listPeriod")
    public ResponseEntity listPeriod() {

        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.periodTypes_Consult()}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString("PT_IdPeriod"));
                        jsonMap.put("name", resultSet.getString("PT_IdPeriod"));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/actorTypeSelected")
    @Cacheable(value = "actorTypeSelected", key = "#_company.concat('-').concat(#_type)")
    public ResponseEntity listPeriod(@RequestParam(value = "company") String _company, @RequestParam(value = "type") String _type) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            Object[] params = new Object[]{_type, _company};
            jdbcTemplate.query("{call dbo.actorType_selected_Consult(?,?)}", params, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(1));
                        jsonMap.put("name", resultSet.getString(2));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listLob1")
    @Cacheable(value = "listLob1", key = "#_company")
    public ResponseEntity listLob1(@RequestParam(value = "company") String _company) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.HistoricalSales_LOB1_Consult(?)}", new Object[]{_company}, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(1));
                        jsonMap.put("name", resultSet.getString(1));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listPrincipals")
    public ResponseEntity listPrincipals(@RequestParam(value = "company") String _company, @RequestParam(value = "buAgrupada") String buAgrupada) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.Principals_Consult(?,?)}", new Object[]{_company, buAgrupada}, resultSet ->
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

    @GetMapping("/utils/listSales")
    @Cacheable(value = "listSales", key = "#_company")
    public ResponseEntity listSales(@RequestParam(value = "company") String _company) {

        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.HistoricalSales_BU_Consult(?,?)}", new Object[]{null, _company}, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString("HS_CustomerBU"));
                        jsonMap.put("name", resultSet.getString("HS_CustomerBUDesc"));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listStatusUniverse")
    @Cacheable(value = "listStatusUniverse")
    public ResponseEntity listStatusUniverse() {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.PPC_status_Consult()}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(1));
                        jsonMap.put("name", resultSet.getString(2));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listPM")
    @Cacheable(value = "listPM")
    public ResponseEntity listPM() {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.UsersPriceToolId_Consult()}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(1));
                        jsonMap.put("name", resultSet.getString(1));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listSupplier")
    @Cacheable(value = "listSupplier", key = "#_company")
    public ResponseEntity listSupplier(@RequestParam(value = "company") String _company) {

        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.ItemsJDE_Supplier_Consult(?)}", new Object[]{_company}, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(2));
                        jsonMap.put("name", resultSet.getString(2));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listCustomer")
    @Cacheable(value = "listCustomer", key = "#_company")
    public ResponseEntity listCustomer(@RequestParam(value = "company") String _company) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.historicalSales_customers_Consult(?)}", new Object[]{_company}, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString("HS_AddressNumber"));
                        jsonMap.put("name", resultSet.getString("HS_Customer"));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listSr")
    @Cacheable(value = "listSr")
    public ResponseEntity listSr() {

        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.UsersPriceTool_SRId_Consult()}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(1));
                        jsonMap.put("name", resultSet.getString(1));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listBranchPlant")
    public ResponseEntity listBranchPlant(
            @RequestParam(value = "company") String _company) {

        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.UsersPriceTool_BranchPlant_Consult(" + _company + ")}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString("BRP_ID"));
                        jsonMap.put("name", resultSet.getString("BRP_Description"));
                        jsonMap.put("selected", resultSet.getString("BRP_DefaultSelection"));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listPPCAprove")
    public ResponseEntity listPPCAprove(@RequestParam(value = "BU_ID", required = false) String _BU_ID,
                                        @RequestParam(value = "typeAprov", required = false) String typeAprov,
                                        @RequestParam(value = "COU_ID", required = false) String COU_ID) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            if (_BU_ID == "")
                _BU_ID = null;
            if (typeAprov == "")
                typeAprov = null;
            if (COU_ID == "")
                COU_ID = null;
            jdbcTemplate.query("{call dbo.PPCH_aproval_Consul(?, ?, ?)}", new Object[]{_BU_ID, typeAprov, COU_ID}, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(1));
                        jsonMap.put("name", resultSet.getString(1));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/utils/listPPCAcceptDiscardConsult")
    @Cacheable(value = "listPPCAcceptDiscardConsult", key = "#PPCH_ProcedureType")
    public ResponseEntity listPPCAcceptDiscardConsult(
            @RequestParam(value = "PPCH_ProcedureType", required = false) String PPCH_ProcedureType
    ) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.PPCLinesStatus_Consult('"+PPCH_ProcedureType+"')}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString("PPCLS_Code"));
                        jsonMap.put("name", resultSet.getString("PPCLS_Descripcion"));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listReason")
    @Cacheable(value = "listReason")
    public ResponseEntity listReason() {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.reason_Consult()}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString(1));
                        jsonMap.put("name", resultSet.getString(1));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/statusFollowUp")
    public ResponseEntity statusFollowUp(
            @RequestParam(value = "PPCH_Id", required = false) String PPCH_Id
    ) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);

            jdbcTemplate.query("{call dbo.PPC_statusLog_Consult(" + PPCH_Id + ")}", resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        int numColumns = rsmd.getColumnCount();
                        JSONObject obj = new JSONObject();
                        for (int i = 1; i <= numColumns; i++) {
                            String column_name = rsmd.getColumnName(i);
                            obj.put(column_name, resultSet.getObject(column_name));
                        }
                        jsonArray.add(obj);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);

        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/PPC_PM_Activity")
    public ResponseEntity PPC_PM_Activity(
            @RequestParam(value = "PPCH_Id", required = false) String PPCH_Id
    ) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);

            jdbcTemplate.query("{call dbo.PPC_PMActivity_Consult(" + PPCH_Id + ")}", resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        int numColumns = rsmd.getColumnCount();
                        JSONObject obj = new JSONObject();
                        for (int i = 1; i <= numColumns; i++) {
                            String column_name = rsmd.getColumnName(i);
                            obj.put(column_name, resultSet.getObject(column_name));
                        }
                        jsonArray.add(obj);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);

        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/PPC_SR_Activity")
    public ResponseEntity PPC_SR_Activity(
            @RequestParam(value = "PPCH_Id", required = false) String PPCH_Id
    ) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);

            jdbcTemplate.query("{call dbo.PRC_SRActivity_Consult(" + PPCH_Id + ")}", resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        int numColumns = rsmd.getColumnCount();
                        JSONObject obj = new JSONObject();
                        for (int i = 1; i <= numColumns; i++) {
                            String column_name = rsmd.getColumnName(i);
                            obj.put(column_name, resultSet.getObject(column_name));
                        }
                        jsonArray.add(obj);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);

        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/PPC_PRC_Activity_Consult")
    public ResponseEntity PPC_PRC_Activity_Consult(
            @RequestParam(value = "PPCSL_Author", required = true) String PPCSL_Author
    ) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);

            jdbcTemplate.query("{call dbo.PPC_PRC_Activity_Consult('" + PPCSL_Author + "')}", resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        int numColumns = rsmd.getColumnCount();
                        JSONObject obj = new JSONObject();
                        for (int i = 1; i <= numColumns; i++) {
                            String column_name = rsmd.getColumnName(i);
                            obj.put(column_name, resultSet.getObject(column_name));
                        }
                        jsonArray.add(obj);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);

        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/utils/configuration")
    public ResponseEntity configuration() {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.Configuration_Consult()}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("CFG_ActiveLdap", resultSet.getString("CFG_ActiveLdap"));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/utils/test-ldap-connection")
    public ResponseEntity testLdapConnection() {
        try {
            AtomicReference<String> errorMessage = new AtomicReference<>("");
            String ldapError = "LDAP_ERROR";

            ArrayList<String> ldap = new ArrayList<>();
            jdbcTemplate.query("{call dbo.Configuration_Consult()}", resultSet ->
            {
                ldap.add(resultSet.getString("CFG_ActiveLdap"));
            });
            String ldapValue = ldap.get(0);

            if (ldapValue.equals("1")){
                Integer result = userService.testLdapConnection();
                jdbcTemplate.setResultsMapCaseInsensitive(true);
                jdbcTemplate.query("{call dbo.PriceTool_connectionLdapUptate(?)}", new Object[]{result}, resultSet ->
                        {
                            Integer sendEmail = resultSet.getInt(1);
                            if (sendEmail.equals(1) && result.equals(0)) {
                                try {
                                    if(utilsService.configurationMails()) {
                                        emailService.sendEmail(ldapError, null, null);
                                    } else {
                                        LOG.error("CONFIGURACION DE ENVIO DE MAIL DESHABILITADA");
                                    }
                                } catch (Exception e) {
                                    LOG.error("ERROR EN EL ENVIO DE MAILS -> ", e);
                                }
                            }
                        }
                );

                if (result.equals(0)) {

                    jdbcTemplate.query("{call dbo.Configuration_AlertMessage_Consult(?)}", new Object[]{ldapError}, resultSet ->
                    {
                        errorMessage.set(resultSet.getString("CAM_Body"));
                    });
                    return new ResponseEntity<Object>(errorMessage, HttpStatus.OK);
                }
            }

            return new ResponseEntity<Object>(
                    "", HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/utils/test-mail-connection")
    public ResponseEntity testMailConnection() {
        try {
            AtomicReference<String> errorMessage = new AtomicReference<>("");
            Integer result = utilsService.testMailConnection();
//            Integer result = 0;
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.execute("{call dbo.PriceTool_connectionMailUptate("+ result +")}");

            if (result.equals(0)) {
                jdbcTemplate.query("{call dbo.Configuration_AlertMessage_Consult(?)}", new Object[]{"MAIL_ERROR"}, resultSet ->
                {
                    errorMessage.set(resultSet.getString("CAM_Body"));
                });
                return new ResponseEntity<Object>(errorMessage, HttpStatus.OK);
            }
            return new ResponseEntity<Object>(
                    "", HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("utils/configurationAlertMessage")
    public ResponseEntity configurationAlertMessage(
            @RequestParam(value = "idMensaje", required = true) String _IdMensaje
    ) {
        //System.out.println("Entra a UtilsController func: configurationAlertMessage");
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.Configuration_AlertMessage_Consult(?)}", new Object[]{_IdMensaje}, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("title", resultSet.getString("CAM_Title"));
                        jsonMap.put("body", resultSet.getString("CAM_Body"));
                        jsonMap.put("icon", resultSet.getString("CAM_Icon"));
                        jsonMap.put("buttons", resultSet.getString("CAM_Buttons"));
                        jsonMap.put("button1", resultSet.getString("CAM_Button1"));
                        jsonMap.put("button2", resultSet.getString("CAM_Button2"));
                        jsonMap.put("dangerMode", resultSet.getString("CAM_DangerMode"));
                        jsonMap.put("type", resultSet.getString("CAM_Type"));
                        jsonArray.add(jsonMap);
                    }
            );
            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("error", e);
            return new ResponseEntity<Object>(e,
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/configuration/{param}")
    public ResponseEntity configuration(@PathVariable String param) {
        try {
            JSONObject jsonMap = utilsService.getConfigurationParam(param);

            return new ResponseEntity<Object>(
                    jsonMap,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/utils/ConfigurationProductExcel_Consult")
    public ResponseEntity ConfigurationProductExcel_Consult() {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);

            jdbcTemplate.query("{call dbo.ConfigurationProductExcel_Consult()}", resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        int numColumns = rsmd.getColumnCount();
                        JSONObject obj = new JSONObject();
                        for (int i = 1; i <= numColumns; i++) {
                            String column_name = rsmd.getColumnName(i);
                            obj.put(column_name, resultSet.getObject(column_name));
                        }
                        jsonArray.add(obj);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);

        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping("/utils/listConfigurationProductexcelPass")
    public ResponseEntity listConfigurationProductexcelPass() {

        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.ConfigurationProductexcelPass_Consult()}", resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("id", resultSet.getString("CPEP_OrderPass"));
                        jsonMap.put("name", resultSet.getString("CPEP_MessagePass"));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("utils/info_pricetool")
    public ResponseEntity infoPricetool(
            @RequestParam(value = "UBT_Id") String UBT_Id
    ) {
        //System.out.println("Entra a UtilsController func: configurationAlertMessage");
        try {
            JSONObject jsonMap = new JSONObject();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.BudgetTool_UserInfo_Consult(?)}", new Object[]{UBT_Id}, resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        int numColumns = rsmd.getColumnCount();
                        for (int i = 1; i <= numColumns; i++) {
                            String column_name = rsmd.getColumnName(i);
                            jsonMap.put(column_name, resultSet.getObject(column_name));
                        }
                    }
            );
            return new ResponseEntity<Object>(
                    jsonMap,
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("error", e);
            return new ResponseEntity<Object>(e,
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/utils/ActivityLog_Insert")
    public ResponseEntity insertActivityLog(@RequestParam(value = "LocalAdUser") String LocalAdUser,
                                            @RequestParam(value = "TaskName") String TaskName,
                                            @RequestParam(value = "Status") String Status) {
        try {
            List prmtrsList = new ArrayList();
            prmtrsList.add(new SqlParameter("LocalADUser", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("TaskName", Types.VARCHAR));
            prmtrsList.add(new SqlParameter("Status", Types.VARCHAR));


            Map<String, Object> resultData = jdbcTemplate.call(connection -> {

                CallableStatement callableStatement = connection.prepareCall("{call Activity_Log_Insert(?,?,?)}");
                callableStatement.setString("LocalADUser", LocalAdUser);
                callableStatement.setString("TaskName", TaskName);
                callableStatement.setString("Status", Status);
                return callableStatement;
            }, prmtrsList);

            return new ResponseEntity<Object>(
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/utils/ActivityLog_Consult")
    public ResponseEntity consultActivityLog(@RequestParam(value = "LocalAdUser") String LocalAdUser, @RequestParam(value = "taskName") String taskName){
        try {
            JSONObject jsonMap = new JSONObject();

            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.Actitivy_Log_Consult(?,?)}", new Object[]{LocalAdUser, taskName}, resultSet -> {

                jsonMap.put("logExists", resultSet.getString(1));

            });

            return new ResponseEntity<Object>(jsonMap, HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/pending_tasks")
    public ResponseEntity pendingTasks(
            @RequestParam(value = "UBT_Id", required = true) String UBTId,
            @RequestParam(value = "rol", required = false) String rol,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "country", required = false) String country,
            @RequestParam(value = "delayed", required = false) String delayed,
            @RequestParam(value = "process", required = false) String process,
            @RequestParam(value = "user", required = false) String user,
            @RequestParam(value = "bu", required = false) String bu,
            @RequestParam(value = "offset", required = false) Integer offset,
            @RequestParam(value = "limit", required = false) Integer limit,
            @RequestParam(value = "order", required = false) String order,
            @RequestParam(value = "sort", required = false) String sort
    ) {
        try {
            JSONArray jsonArray = new JSONArray();
            AtomicInteger total = new AtomicInteger();
            jdbcTemplate.setResultsMapCaseInsensitive(true);

            Object[] params = new Object[]{UBTId, rol,status, country, delayed, process, user, bu,
                    offset, offset + limit, sort, order};
            jdbcTemplate.query("{call dbo.PendingTask_Filter(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}", params, resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        int numColumns = rsmd.getColumnCount();
                        JSONObject obj = new JSONObject();
                        for (int i = 1; i <= numColumns; i++) {
                            String column_name = rsmd.getColumnName(i);
                            obj.put(column_name, resultSet.getObject(column_name));
                        }
                        jsonArray.add(obj);
                        total.set(resultSet.getInt("total"));
                    }
            );

            JSONObject jsonMap = new JSONObject();
            jsonMap.put("total", total);
            jsonMap.put("rows", jsonArray);

            return new ResponseEntity<Object>(
                    jsonMap,
                    HttpStatus.OK);

        } catch (Exception e) {
            LOG.error("error", e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/utils/pending_task_sel/{param}")
    public ResponseEntity pendingTasks(
            @PathVariable String param,
            @RequestParam(value = "UBT_Id") String UBT_Id,
            @RequestParam(value = "rol", required = false) String rol,
            @RequestParam(value = "id", required = false) String id) {
        try {
            JSONArray jsonArray = new JSONArray();

            Object[] params = new Object[]{UBT_Id, rol, param, id};
            jdbcTemplate.query("{call dbo.PendingTask_getValuesForSelect(?, ?, ?, ?)}", params, resultSet ->
                    {
                        JSONObject obj = new JSONObject();
                        String value = resultSet.getString(1);
                        for (String v : value.split(", ")) {
                            obj = new JSONObject();
                            obj.put("value", v);
                            if (!jsonArray.contains(obj)) {
                                jsonArray.add(obj);
                            }
                        }
                        if (id != null) {
                            obj.put("id", resultSet.getObject(2));
                        }
                        if (!jsonArray.contains(obj)) {
                            jsonArray.add(obj);
                        }
                    }
            );
            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/utils/defaultCurrency")
    public ResponseEntity DefaaultCurrency(
            @RequestParam(value = "PPCH_Id", required = false) String PPCH_Id
    ) {
        try {
            JSONObject jsonMap = new JSONObject();
            jdbcTemplate.setResultsMapCaseInsensitive(true);

            jdbcTemplate.query("{call dbo.DefaultCurrency_Consult(" + PPCH_Id + ")}", resultSet ->
                    {
                        jsonMap.put("currency", resultSet.getString(1));
                    }
            );

            return new ResponseEntity<Object>(
                    jsonMap,
                    HttpStatus.OK);

        } catch (Exception e) {
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @GetMapping("/utils/listProductTradeName")
    public ResponseEntity listProductTradeName(@RequestParam(value = "principal") String principal, @RequestParam(value = "COU_Id") String COU_Id,@RequestParam(value = "BU_AGRUPADA") String buAgrupada) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.Bum_TradeName_Dropdown_Consult(?,?,?)}", new Object[]{principal,COU_Id, buAgrupada}, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("name", resultSet.getString("name"));
                        jsonMap.put("id", resultSet.getString("id"));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @GetMapping("/utils/listPrincipalReportingLine")
    @Cacheable(value = "listPrincipalReportingLine", key = "#ppchId")
    public ResponseEntity listPrincipalReportingLine(@RequestParam(value = "PPCH_ID") String ppchId) {
        try {
            JSONArray jsonArray = new JSONArray();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            jdbcTemplate.query("{call dbo.ItemsJDE_PrincipalReportingLine_Consult(?)}", new Object[]{ppchId}, resultSet ->
                    {
                        JSONObject jsonMap = new JSONObject();
                        jsonMap.put("name", resultSet.getString("name"));
                        jsonArray.add(jsonMap);
                    }
            );

            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/utils/listProductTradeReportingLineText")
    //@Cacheable(value = "listCustomer", key = "#ppchId")
    public ResponseEntity listProductTradeReportingLineText(@RequestParam(value = "PPCH_ID") String ppchId) {
        try {
            JSONObject jsonObject = new JSONObject();
            jdbcTemplate.setResultsMapCaseInsensitive(true);
            JSONArray jsonArrayTradeName = new JSONArray();
            jdbcTemplate.query("{call dbo.PPCLines_PRCFile_TradeName_Consult(?)}", new Object[]{ppchId}, resultSet ->
                    {
                        jsonArrayTradeName.add(resultSet.getString("IJDE_TRADENAME"));
                    }
            );
            jsonObject.put("tradeName", jsonArrayTradeName);
            JSONArray jsonArrayRepLine = new JSONArray();
            jdbcTemplate.query("{call dbo.PPCLines_PRCFile_Repline_Consult(?)}", new Object[]{ppchId}, resultSet ->
                    {
                        jsonArrayRepLine.add(resultSet.getString("IJDE_REPLINE"));
                    }
            );
            jsonObject.put("repLine",jsonArrayRepLine);
            return new ResponseEntity<Object>(
                    jsonObject,
                    HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
