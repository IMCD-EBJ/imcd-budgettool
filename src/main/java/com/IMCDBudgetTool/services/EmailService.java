package com.IMCDBudgetTool.services;

import net.minidev.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EmailService {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private JavaMailSender sender;

    Logger logger = LoggerFactory.getLogger(EmailService.class);
    public void sendEmail(String idMensaje, String PPCH_Id, String UBT_Id) throws Exception {

        JSONObject jsonMap = new JSONObject();
        jdbcTemplate.setResultsMapCaseInsensitive(true);
        Object[] paramsMessage = new Object[]{idMensaje};
        Object[] paramsComsults = new Object[]{PPCH_Id, UBT_Id};
        jdbcTemplate.query("{call dbo.Configuration_Message_Consult(?)}", paramsMessage, resultSet ->
                {

                    jsonMap.put("to", this.cogerTextoPorProcesos(resultSet.getString("to"), paramsComsults));
                    jsonMap.put("cc", this.cogerTextoPorProcesos(resultSet.getString("cc"), paramsComsults));
                    jsonMap.put("bcc", this.cogerTextoPorProcesos(resultSet.getString("bcc"), paramsComsults));
                    jsonMap.put("subject", this.procesarTexto(resultSet.getString("subject"), paramsComsults));
                    jsonMap.put("body",  this.procesarTexto(resultSet.getString("body"), paramsComsults));
                }
        );

        this.sendMailTo(jsonMap.getAsString("to"),
                jsonMap.getAsString("cc"),
                jsonMap.getAsString("bcc"),
                jsonMap.getAsString("subject"),
                jsonMap.getAsString("body"));
    }
    private void sendMailTo(String to, String cc, String bbc, String subject, String body) throws Exception {
        MimeMessage message = sender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message);

        if(to != null && !to.isEmpty() && !to.toLowerCase(Locale.ROOT).equals("null")) {

            helper.setTo(to.split(";"));

            if (cc != null && !cc.isEmpty() && !cc.toLowerCase(Locale.ROOT).equals("null")) {
                helper.setCc(cc.split(";"));
            }
            if (bbc != null && !bbc.isEmpty() && !bbc.toLowerCase(Locale.ROOT).equals("null")) {
                helper.setBcc(bbc.split(";"));
            }

            helper.setText(body, true);
            helper.setSubject(subject);
            helper.setFrom("pricetool_noreply@imcd.es");

            sender.send(message);
//            logger.info("SE ENVIO EL MAIL");
        }

    }

    private String cogerTextoPorProcesos(String procedures, Object[] paramsConsult) {
        StringBuilder stringBuilder = new StringBuilder();
        StringBuilder result = new StringBuilder();
//        logger.error("INFO PROCEDURES");
        if (procedures != null) {
            for (String procedure : procedures.split(";")) {
                long totalInt = procedure.chars().filter(ch -> ch == '?').count();
                Object[] paramsSendProcedure;
                if(totalInt > 1) {
                    paramsSendProcedure = paramsConsult;
                } else {
                    paramsSendProcedure = new Object[]{paramsConsult[0]};
                }
//                logger.error(procedure);
//                logger.error(paramsConsult[0].toString());
//                logger.error(paramsConsult[1].toString());
                try{
                    jdbcTemplate.query("{call dbo."+procedure+"}", paramsSendProcedure, resultSet ->
                            {
                                String res = resultSet.getString(1);
                                if(res != null && !res.isEmpty() && !res.toLowerCase(Locale.ROOT).equals("null")) {
                                    stringBuilder.append(res);
                                    stringBuilder.append(";");
                                }
                            }
                    );
                }catch (Exception e) {
                    logger.error("ERROR AL EJECUTAR PROCESO "+procedure, e);
                }
            }
        }

//        logger.error(stringBuilder.toString());
        for(String s: stringBuilder.toString().split(";")) {
            if (!result.toString().contains(s)) {
                result.append(s).append(";");
            }
        }
        return result.length() >0 ? StringUtils.removeEnd(result.toString(),";") : null;
    }

    // QUITAR METDODO
    private String procesarTexto(String txt, Object[] paramsConsult) {
        final String[] result = {txt};
        Pattern pattern = Pattern.compile("\\[(.*?)\\]");
        Matcher matcher = pattern.matcher(txt);

        while(matcher.find()) {
            String tag = matcher.group(1);
            Object[] paramTags = new Object[]{tag};
            jdbcTemplate.query("{call dbo.Configuration_Tags_Consult(?)}", paramTags, resultSet ->
                    {
                        String procedures = resultSet.getString(1);
                        if(procedures != null && !procedures.isEmpty()) {
                            result[0] = result[0].replace("["+tag+"]",
                                    cogerTextoPorProcesos(procedures, paramsConsult));
                        }
                    }
            );
        }
        return result[0];
    }
}
