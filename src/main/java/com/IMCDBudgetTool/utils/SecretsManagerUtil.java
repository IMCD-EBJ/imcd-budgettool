package com.IMCDBudgetTool.utils;

import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.services.secretsmanager.AWSSecretsManager;
import com.amazonaws.services.secretsmanager.AWSSecretsManagerClientBuilder;
import com.amazonaws.services.secretsmanager.model.GetSecretValueRequest;
import com.amazonaws.services.secretsmanager.model.GetSecretValueResult;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;


public class SecretsManagerUtil {

    public static DatabaseCredentials getDatabaseCredentials(String secretName, String region) throws  JSONException {
        AWSSecretsManager client = AWSSecretsManagerClientBuilder.standard()
                .withRegion(region)
                .withCredentials(new DefaultAWSCredentialsProviderChain())
                .build();

        GetSecretValueRequest request = new GetSecretValueRequest()
                .withSecretId(secretName);

        GetSecretValueResult result = client.getSecretValue(request);

        String secretString = result.getSecretString();
        JSONObject json = new JSONObject(secretString);

        DatabaseCredentials credentials = new DatabaseCredentials();
        credentials.setUsername(json.getString("username"));
        credentials.setPassword(json.getString("password"));
        credentials.setHost(json.getString("host"));
        credentials.setPort(json.getInt("port"));

        return credentials;
    }
}


