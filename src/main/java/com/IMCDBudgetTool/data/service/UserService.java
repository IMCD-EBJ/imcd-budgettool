package com.IMCDBudgetTool.data.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.ldap.AuthenticationException;
import org.springframework.ldap.CommunicationException;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.filter.Filter;
import org.springframework.stereotype.Service;

@Service
public  class UserService {

    private static Logger LOG = LoggerFactory.getLogger(UserService.class);

    @Autowired
    @Qualifier("ldapTemplate")
    private LdapTemplate ldapTemplate;

    @Autowired
    @Qualifier("ldapTemplateTestConection")
    private LdapTemplate ldapTemplateTestConection;

    public Boolean authenticate(final String username, final String password) {
        try {
            if(password == null || password.equals("")){
                return false;
            }
            ldapTemplate.setIgnorePartialResultException(true);
            Filter filter = new EqualsFilter("sAMAccountName", username);

            return ldapTemplate.authenticate("", filter.encode(), password);
        } catch (Exception ex){
            LOG.error("ERROR: -> ", ex);
            return false;
        }
    }

    public Integer testLdapConnection() {
        try{
            String testAuth = "TEST_CONNECTION";
            Filter filter = new EqualsFilter("sAMAccountName", testAuth);
            ldapTemplateTestConection.authenticate("", filter.encode(), testAuth);
        } catch (CommunicationException | AuthenticationException ce) {
            return 0;
        } catch (Exception e) {
            LOG.error("ERROR: -> ", e);
        }
        return 1;
    }
}
