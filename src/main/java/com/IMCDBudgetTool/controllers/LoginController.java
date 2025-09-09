package com.IMCDBudgetTool.controllers;

import com.IMCDBudgetTool.data.service.UserService;
import com.IMCDBudgetTool.utils.AesUtil;
import net.minidev.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.env.Environment;
import java.security.Principal;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LoginController {

    @Autowired
    private JdbcTemplate jdbcTemplate;


    private static Logger LOG = LoggerFactory.getLogger(LoginController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private Environment env;

    @PostMapping("/login_app")
    public ResponseEntity login(Principal principal) throws Exception {

        net.minidev.json.JSONArray jsonArray = new net.minidev.json.JSONArray();
        String _userId = principal.getName();

        jdbcTemplate.setResultsMapCaseInsensitive(true);
        jdbcTemplate.query("{call dbo.BudgetTool_Login(?)}", new Object[]{_userId}, resultSet ->
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

    public String desEncrypt(String password) {
        String decryptedPassword =  new String(java.util.Base64.getDecoder().decode(password));
        AesUtil aesUtil = new AesUtil(128, 1000);

        if (decryptedPassword != null && decryptedPassword.split("::").length == 3) {
            return  aesUtil.decrypt(
                    decryptedPassword.split("::")[1],
                    decryptedPassword.split("::")[0],
                    "1234567891234567",
                    decryptedPassword.split("::")[2]);
        }

        return null;
    }
}
