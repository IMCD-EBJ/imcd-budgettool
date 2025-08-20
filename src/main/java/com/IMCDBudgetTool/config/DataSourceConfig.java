package com.IMCDBudgetTool.config;

import org.codehaus.jettison.json.JSONException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    private final Environment environment;

    public DataSourceConfig(Environment environment) {
        this.environment = environment;
    }

    @Value("${aws.datasource.secret}")
    private String awsDatasourceSecret;

    @Bean
    public DataSource dataSource() throws JSONException {
        return new DynamicDataSource(awsDatasourceSecret, "eu-central-1", environment);
    }
}
