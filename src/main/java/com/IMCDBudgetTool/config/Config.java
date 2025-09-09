package com.IMCDBudgetTool.config;

import com.ulisesbocchio.jasyptspringboot.annotation.EnableEncryptableProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.env.Environment;
import org.springframework.data.ldap.repository.config.EnableLdapRepositories;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableEncryptableProperties
@PropertySource("classpath:application.properties")
@ComponentScan(basePackages = {"com.IMCDBudgetTool.*"})
//@Profile("default")
@EnableLdapRepositories(basePackages = "com.IMCDBudgetTool.**")
public class Config {

    @Autowired
    private Environment env;


    private static Logger LOG = LoggerFactory.getLogger(Config.class);

    @Bean
    public LdapContextSource contextSource() {
        LdapContextSource contextSource = new LdapContextSource();
        LOG.info("contextSource");
        contextSource.setUrl(env.getRequiredProperty("ldap.url"));
        contextSource.setBase(env.getRequiredProperty("ldap.partitionSuffix"));
        contextSource.setUserDn(env.getRequiredProperty("ldap.principal"));
        contextSource.setPassword(env.getRequiredProperty("ldap.password"));

        return contextSource;
    }

    @Bean
    public LdapTemplate ldapTemplate() {
        return new LdapTemplate(contextSource());
    }


    @Bean
    public LdapContextSource contextSourceTestConection() {
        LdapContextSource contextSource = new LdapContextSource();
        LOG.info("contextSource");

        Map<String, Object> baseEnv = new HashMap<>();
        baseEnv.put("com.sun.jndi.ldap.connect.timeout", "100");
        baseEnv.put("com.sun.jndi.ldap.read.timeout", "100");

        contextSource.setUrl(env.getRequiredProperty("ldap.url"));
        contextSource.setBase(env.getRequiredProperty("ldap.partitionSuffix"));
        contextSource.setUserDn(env.getRequiredProperty("ldap.principal"));
        contextSource.setPassword(env.getRequiredProperty("ldap.password"));
        contextSource.setBaseEnvironmentProperties(baseEnv);

        return contextSource;
    }

    @Bean
    public LdapTemplate ldapTemplateTestConection() {
        return new LdapTemplate(contextSourceTestConection());
    }

}
