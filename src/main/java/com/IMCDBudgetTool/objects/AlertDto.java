package com.IMCDBudgetTool.objects;

public class AlertDto {
    public String AlertName;

    public int PpcId;

    public String PpcDescription;

    public AlertDto(
            String alertName,
            int ppcId,
            String ppcDescription) {
        AlertName = alertName;
        PpcId = ppcId;
        PpcDescription = ppcDescription;
    }

    public String getAlertName() {
        return AlertName;
    }

    public void setAlertName(String alertName) {
        AlertName = alertName;
    }

    public int getPpcId() {
        return PpcId;
    }

    public void setPpcId(int ppcId) {
        PpcId = ppcId;
    }

    public String getPpcDescription() {
        return PpcDescription;
    }

    public void setPpcDescription(String ppcDescription) {
        PpcDescription = ppcDescription;
    }
}
