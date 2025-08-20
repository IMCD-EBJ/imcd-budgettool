package com.IMCDBudgetTool.controllers;

import com.IMCDBudgetTool.services.EmailService;
import com.IMCDBudgetTool.services.UtilsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class EmailController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UtilsService utilsService;

    Logger logger = LoggerFactory.getLogger(EmailController.class);

    @PostMapping("/email/send")
    public ResponseEntity sendMail(
            @RequestParam(value = "idMensaje") String idMensaje,
            @RequestParam(value = "PPCH_Id") String PPCH_Id,
            @RequestParam(value = "UBT_Id") String UBT_Id) {

        try {

            if(!utilsService.configurationMails()) {
                return new ResponseEntity<Object>("Configuracion para el envio de mails deshabilitada",
                        HttpStatus.BAD_REQUEST);
            }

            emailService.sendEmail(idMensaje, PPCH_Id, UBT_Id);
            return new ResponseEntity<Object>("Mensajes enviados",
                    HttpStatus.OK);
        } catch (Exception e) {
            logger.error("ERROR: ", e);
            return new ResponseEntity<Object>(e.getMessage(),
                    HttpStatus.BAD_REQUEST);
        }
    }

}
