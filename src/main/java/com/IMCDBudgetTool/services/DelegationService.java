package com.IMCDBudgetTool.services;

import com.IMCDBudgetTool.controllers.DelegationController;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashMap;
import java.util.Map;

@Service
public class DelegationService {
    @Autowired
    private JdbcTemplate jdbcTemplate;
    private Map<String, String> mapaDelegationProcedures;
    private static Logger LOG = LoggerFactory.getLogger(DelegationService.class);

    private DelegationService() {
        mapaDelegationProcedures = new HashMap<>();
        mapaDelegationProcedures.put("index", "dbo.All_UsersDelegation_List_Consult (?,?)");
        mapaDelegationProcedures.put("bum_process", "dbo.BUM_UsersDelegation_List_Consult (?)");
        mapaDelegationProcedures.put("pm_process", "dbo.All_UsersDelegation_List_Consult (?,?)");
        mapaDelegationProcedures.put("sr_process", "dbo.All_UsersDelegation_List_Consult (?,?)");
    }


    public JSONArray getDelegationUsers(@RequestParam(value = "userActive") String user,
                                        @RequestParam(value = "pantalla") String pantalla,
                                        @RequestParam(value = "BU_AGRUPADA") String buAgrupada){
        JSONArray jsonArray = new JSONArray();
        jdbcTemplate.setResultsMapCaseInsensitive(true);

        String procedure = mapaDelegationProcedures.get(pantalla);

        Object[] params;
        if (pantalla.equals("bum_process")){
            params = new Object[]{user};
        }else{
            params = new Object[]{user, buAgrupada};
        }

        jdbcTemplate.query("{call " + procedure+"}", params, resultSet -> {
            JSONObject jsonMap = new JSONObject();
            jsonMap.put("localAdUser", resultSet.getString(1));
            jsonMap.put("name", resultSet.getString(2));
            jsonArray.add(jsonMap);
        });

        return jsonArray;
    }

    public String getUsersDelegationString(String UBT_LocalADUuser, String pantalla, String buAgrupada){
        JSONArray arrayDelegatedList = getDelegationUsers(UBT_LocalADUuser, pantalla, buAgrupada);
        String usersDelegation = "";
        for (Object userDelegated : arrayDelegatedList.toArray()){
            JSONObject jsonUserDelegated = (JSONObject) userDelegated;
            String userDelegatedString = jsonUserDelegated.get("localAdUser").toString();
            usersDelegation += "'"+userDelegatedString+"',";
        }
        usersDelegation = usersDelegation.substring(0, usersDelegation.length() - 1);
        return usersDelegation;
    }
}
