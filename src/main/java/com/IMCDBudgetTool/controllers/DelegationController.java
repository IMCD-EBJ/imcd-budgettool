package com.IMCDBudgetTool.controllers;

import com.IMCDBudgetTool.data.service.UserService;
import com.IMCDBudgetTool.services.DelegationService;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class DelegationController {


    @Autowired
    private JdbcTemplate jdbcTemplate;


    @Autowired
    private UserService userService;

    @Autowired
    private DelegationService delegationService;


    private static Logger LOG = LoggerFactory.getLogger(DelegationController.class);

    @GetMapping("delegation/usersList")
    public ResponseEntity getDelegationUsers(@RequestParam(value = "userActive") String user,@RequestParam(value = "BU_AGRUPADA") String buAgrupada , @RequestParam(value = "pantalla") String pantalla){
        try {
            return new ResponseEntity<Object>(delegationService.getDelegationUsers(user, pantalla, buAgrupada), HttpStatus.OK);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }


    }


    @PostMapping("delegation/changeUser")
    public ResponseEntity login(@RequestParam(value = "username") String _userId) throws Exception {
        AtomicReference<Boolean> activeLdap = new AtomicReference<>(false);
        net.minidev.json.JSONArray jsonArray = new net.minidev.json.JSONArray();

        jdbcTemplate.setResultsMapCaseInsensitive(true);
        jdbcTemplate.query("{call dbo.BudgetTool_Login(?,?)}", new Object[]{_userId,""}, resultSet ->
                {
                    JSONObject jsonMap = new JSONObject();
                    jsonMap.put("UBT_TipoUserId", resultSet.getString("UBT_TipoUserId"));
                    jsonMap.put("UBT_Id", resultSet.getString("UBT_Id"));
                    jsonMap.put("bu_agrupada", resultSet.getString("bu_agrupada"));
                    jsonMap.put("UbT_LocalADUuser", resultSet.getString("UbT_LocalADUuser"));
                    jsonMap.put("UBT_UserName", resultSet.getString("UBT_UserName"));
                    jsonMap.put("UBT_Mail", resultSet.getString("UBT_Mail"));
                    jsonMap.put("CFG_SendEmail", resultSet.getBoolean("CFG_SendEmail"));
                    jsonArray.add(jsonMap);
                }
        );


        if (jsonArray.size()>0) {
            return new ResponseEntity<Object>(
                    jsonArray,
                    HttpStatus.OK);
        }
        else
            return new ResponseEntity<Object>(
                    HttpStatus.UNAUTHORIZED);
    }


}
