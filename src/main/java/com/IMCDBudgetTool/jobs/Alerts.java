package com.IMCDBudgetTool.jobs;

import com.IMCDBudgetTool.objects.AlertDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
public class Alerts {

    private static final Logger LOG = LoggerFactory.getLogger(Alerts.class);

    private static final DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

    @Autowired
    private JavaMailSender sender;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 0 * * *")
    public void SendAlerts() {
        LOG.info("Cron Task :: Execution Time - {}", dateTimeFormatter.format(LocalDateTime.now()));

        for(int countryId : this.getCountries())
        {
            Object[] params = new Object[]{ countryId };
            List<String> emailsToSend = this.getPrcMangersFromCountry(params);
            List<AlertDto> alerts = this.GetAlerts(params);

            if (emailsToSend.size() == 0 || alerts.size() == 0)
            {
                continue;
            }

            String bodyMail = this.GetBodyMailFromAlerts(alerts);
            this.sendMail(emailsToSend.toArray(new String[0]), bodyMail);
        }
    }
    private String GetBodyMailFromAlerts(List<AlertDto> alerts)
    {
        String body = "<table width='100%' border='1' align='center'>"
                + "<tr align='center'>"
                + "<td><b>Alert Name<b></td>"
                + "<td><b>PPC Id<b></td>"
                + "<td><b>PPC Description<b></td>"
                + "</tr>";

        for (AlertDto alert : alerts) {
            body = body + "<tr align='center'>"
                    +"<td>" + alert.getAlertName() + "</td>"
                    +"<td>" + alert.getPpcId() + "</td>"
                    +"<td>" + alert.getPpcDescription() + "</td>";

        }

        return body;
    }

    private List<AlertDto> GetAlerts(Object[] params)
    {
        List<AlertDto> alerts = new ArrayList<AlertDto>();

        jdbcTemplate.setResultsMapCaseInsensitive(true);

        jdbcTemplate.query("{call dbo.SystemAlertsPriceTool(?)}", params, resultSet ->
                {
                    alerts.add(
                            new AlertDto(
                                    resultSet.getString(3),
                                    Integer.parseInt(resultSet.getString(1)),
                                    resultSet.getString(2))
                    );
                }
        );

        return alerts;
    }

    private List<Integer> getCountries()
    {
        jdbcTemplate.setResultsMapCaseInsensitive(true);
        List<Integer> countryIds = new ArrayList<>();
        jdbcTemplate.query("{call dbo.countries_Consult()}", resultSet ->
                {
                    countryIds.add(Integer.parseInt(resultSet.getString(1)));
                }
        );

        return countryIds;
    }

    private List<String> getPrcMangersFromCountry(Object[] params)
    {
        jdbcTemplate.setResultsMapCaseInsensitive(true);
        List<String> emails = new ArrayList<String>();

        jdbcTemplate.query("{call dbo.SystemAlertsPriceToolUsers(?)}", params, resultSet ->
                {
                    emails.add(resultSet.getString(1));
                }
        );

        return emails;
    }

    private void sendMail(String[] tos, String body)
    {
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message);
            helper.setTo(tos);
            helper.setText(body, true);
            helper.setSubject("Alertas diarias PriceTool");
            helper.setFrom("pricetool_noreply@imcd.es");
            sender.send(message);

        } catch (Exception e) {
            LOG.error("Error enviando mail");
        }
    }
}
