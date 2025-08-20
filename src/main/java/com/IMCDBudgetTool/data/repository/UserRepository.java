package com.IMCDBudgetTool.data.repository;

import org.springframework.data.ldap.repository.LdapRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends LdapRepository<User> {
    User findByUsernameAndPassword(String username, String password);
}