package com.IMCDBudgetTool.controllers;

import com.IMCDBudgetTool.data.service.UserService;
import com.IMCDBudgetTool.services.DelegationService;
import net.minidev.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

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

    private static final Logger LOG = LoggerFactory.getLogger(DelegationController.class);

    // Lista de delegables: tu servicio llama al SP All_UsersDelegation_List_Consult
    // y devuelve [{ localAdUser, name }]
    @GetMapping("delegation/usersList")
    public ResponseEntity getDelegationUsers(@RequestParam("userActive") String user,
                                             @RequestParam("BU_AGRUPADA") String buAgrupada,
                                             @RequestParam("pantalla") String pantalla) {
        try {
            return new ResponseEntity<>(
                    delegationService.getDelegationUsers(user, pantalla, buAgrupada),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<>("Error al conectar la BD", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Cambio de usuario: mismos campos que usa el header (mapeo UBT_* y bu_agrupada)
    @RequestMapping(value = "delegation/changeUser", method = {RequestMethod.POST, RequestMethod.GET})
    public ResponseEntity login(@RequestParam("username") String _userId) throws Exception {
        AtomicReference<Boolean> activeLdap = new AtomicReference<>(false);
        net.minidev.json.JSONArray jsonArray = new net.minidev.json.JSONArray();

        jdbcTemplate.setResultsMapCaseInsensitive(true);
        jdbcTemplate.query("{call dbo.BudgetTool_Login(?,?)}", new Object[]{_userId, ""}, rs -> {
            JSONObject json = new JSONObject();
            json.put("UBT_TipoUserId",   rs.getString("UBT_TipoUserId"));
            json.put("UBT_Id",           rs.getString("UBT_Id"));
            json.put("bu_agrupada",      rs.getString("bu_agrupada"));

            String loginAd = rs.getString("UBT_LocalADUuser");
            json.put("UBT_LocalADUuser", loginAd);
            json.put("UbT_LocalADUuser", loginAd);

            json.put("UBT_UserName",     rs.getString("UBT_UserName"));
            json.put("UBT_Mail",         rs.getString("UBT_Mail"));
            json.put("CFG_SendEmail",    rs.getBoolean("CFG_SendEmail"));
            jsonArray.add(json);
        });


        if (jsonArray.size() > 0) {
            return new ResponseEntity<>(jsonArray, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }
}
