package com.IMCDBudgetTool.services;

import net.minidev.json.JSONObject;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import jakarta.mail.Session;
import jakarta.mail.Transport;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class UtilsService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static Logger LOG = LoggerFactory.getLogger(UtilsService.class);

    @Autowired
    private Environment env;

    public JSONObject getConfigurationParam(String param) {

        JSONObject jsonMap = new JSONObject();
        jdbcTemplate.setResultsMapCaseInsensitive(true);
        jdbcTemplate.query("{call dbo.Configuration_Consult()}", resultSet ->
                {
                    jsonMap.put(param, resultSet.getString(param));
                }
        );

        return jsonMap;
    }

    public static void writeRowExcel(ResultSet resultSet, XSSFSheet hojaExcel, AtomicInteger rowid ) throws SQLException {

        ResultSetMetaData rsmd = resultSet.getMetaData();
        int numColumns = rsmd.getColumnCount();

        XSSFRow fila = hojaExcel.createRow(rowid.getAndIncrement());
        for (int i = 1; i <= numColumns; i++) {
            String columName = rsmd.getColumnName(i);
            XSSFCell celda = fila.createCell(i - 1, CellType.STRING);
            String cellValue = resultSet.getString(columName);

            celda.setCellValue(cellValue);
        }
    }

    public int testMailConnection() {
        int result = 0;
        try {
            Properties props = new Properties();
            props.setProperty("mail.smtp.auth", env.getProperty("spring.mail.properties.mail.smtp.auth"));
            props.setProperty("mail.smtp.starttls.enable", env.getProperty("spring.mail.properties.mail.smtp.starttls.enable"));
            props.setProperty("mail.smtp.starttls.required", env.getProperty("spring.mail.properties.mail.smtp.starttls.required"));

            Session session = Session.getInstance(props, null);
            Transport transport = session.getTransport("smtp");
            int portint = Integer.parseInt(env.getProperty("spring.mail.port"));
            transport.connect(env.getProperty("spring.mail.host"), portint,
                    env.getProperty("spring.mail.username"), env.getProperty("spring.mail.password"));
            transport.close();
            result = 1;

        } catch (Exception e) {
            LOG.error("ERROR -> ",e);
        }

        return result;
    }

    public Boolean configurationMails() {
        final Boolean[] result = {false};
        try {
            jdbcTemplate.setResultsMapCaseInsensitive(true);

            jdbcTemplate.query("{call dbo.Configuration_Consult()}", resultSet ->
                    {
                        String confMail = resultSet.getString("CFG_SendEmail");
                        result[0] = confMail.equals("1");
                    }
            );
        } catch (Exception e) {
            LOG.error("ERROR AL COGER CONFIGURACION: ",e);
        }
        return result[0];
    }
}
