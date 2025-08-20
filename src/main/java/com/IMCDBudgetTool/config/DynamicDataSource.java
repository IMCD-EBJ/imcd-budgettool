package com.IMCDBudgetTool.config;

import com.IMCDBudgetTool.utils.SecretsManagerUtil;
import com.IMCDBudgetTool.utils.DatabaseCredentials;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.codehaus.jettison.json.JSONException;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.datasource.AbstractDataSource;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.locks.ReentrantLock;

public class DynamicDataSource extends AbstractDataSource {

    private final String secretName;
    private final String region;
    private final Environment environment;
    private HikariDataSource dataSource;
    private final ReentrantLock lock = new ReentrantLock();
    private DatabaseCredentials lastCredentials;  // Cache de credenciales

    public DynamicDataSource(String secretName, String region, Environment environment) throws JSONException {
        this.secretName = secretName;
        this.region = region;
        this.environment = environment;
        this.dataSource = createNewDataSource();
    }

    private HikariDataSource createNewDataSource() throws JSONException {
        HikariConfig config = new HikariConfig();
        DatabaseCredentials credentials;

        // Detectar si es entorno local
        String activeProfile = environment.getProperty("spring.profiles.active", "default");
        if ("loc".equals(activeProfile)) {
            config.setJdbcUrl(environment.getProperty("spring.datasource.url"));
            credentials = new DatabaseCredentials();
            credentials.setUsername(environment.getProperty("spring.datasource.username"));
            credentials.setPassword(environment.getProperty("spring.datasource.password"));

            if (lastCredentials != null && lastCredentials.getUsername().equals(credentials.getUsername())
                    && lastCredentials.getPassword().equals(credentials.getPassword())) {
                return this.dataSource;  // Reutiliza el mismo pool de conexiones
            }
            lastCredentials = credentials;  // Cachea las nuevas credenciales
            config.setUsername(credentials.getUsername());
            config.setPassword(credentials.getPassword());
        } else {
            credentials = SecretsManagerUtil.getDatabaseCredentials(secretName, region);

            // Si las credenciales son las mismas, no es necesario reiniciar el pool
            if (lastCredentials != null && lastCredentials.getUsername().equals(credentials.getUsername())
                    && lastCredentials.getPassword().equals(credentials.getPassword())) {
                return this.dataSource;  // Reutiliza el mismo pool de conexiones
            }

            lastCredentials = credentials;  // Cachea las nuevas credenciales

            config.setJdbcUrl("jdbc:sqlserver://" + credentials.getHost() + ":" + credentials.getPort()
                    + ";databaseName=BUDGETTOOL;encrypt=true;trustServerCertificate=true;");
            config.setUsername(credentials.getUsername());
            config.setPassword(credentials.getPassword());
        }

        config.setDriverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver");

        // Configuración de HikariCP
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setMaxLifetime(60000);
        config.setConnectionTimeout(30000);

        return new HikariDataSource(config);
    }

    private void refreshDataSource() throws JSONException {
        lock.lock();
        try {
            HikariDataSource newDataSource = createNewDataSource();
            if (newDataSource != this.dataSource) {  // Solo cambia si las credenciales son diferentes
                HikariDataSource oldDataSource = this.dataSource;
                this.dataSource = newDataSource;
                oldDataSource.close(); // Cierra el pool anterior solo si hubo un cambio real
            }
        } finally {
            lock.unlock();
        }
    }

    @Override
    public Connection getConnection() throws SQLException {
        try {
            refreshDataSource(); // Refresca solo si hay cambios en las credenciales
        } catch (JSONException e) {
            throw new SQLException("Error obteniendo credenciales desde Secrets Manager", e);
        }
        return dataSource.getConnection();
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return getConnection(); // Ignora credenciales externas
    }
}
