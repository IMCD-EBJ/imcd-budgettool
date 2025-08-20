package com.IMCDBudgetTool.services;

import org.springframework.jdbc.core.SqlParameter;
import org.springframework.stereotype.Service;

import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PmProcessService {
    public Map<String, String> getPmProcessCampos() {
        Map<String, String> mapaCampos = new HashMap<>();
        mapaCampos.put("REP_LINE/ROY Lyr/tableRepLineRoy/QTY","ROY_LYR_QTY");
        mapaCampos.put("REP_LINE/ROY Lyr/tableRepLineRoy/GMPERC","ROY_LYR_GMPERC");
        mapaCampos.put("REP_LINE/ROY Lyr/tableRepLineRoy/INV","ROY_LYR_INV");
        mapaCampos.put("REP_LINE/ROY Lyr/tableRepLineRoy/GM","ROY_LYR_GM");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineRoy/QTY","ROY_QTY_MGT");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineRoy/GMPERC","ROY_GMPERC_MGT");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineRoy/INV","ROY_INV_MGT");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineRoy/GM","ROY_GM_MGT");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineRoy/VARPERC","VARPERC_ROY_QTY_MGT");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineRoy/QTY","ROY_QTY_PM");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineRoy/GMPERC","ROY_GMPERC_PM");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineRoy/INV","ROY_INV_PM");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineRoy/GM","ROY_GM_PM");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineRoy/VARPERC","VARPERC_ROY_QTY_PM");
        mapaCampos.put("REP_LINE/FCS/tableRepLineBDG/QTY","FCS_QTY");
        mapaCampos.put("REP_LINE/FCS/tableRepLineBDG/GMPERC","FCS_GMPERC");
        mapaCampos.put("REP_LINE/FCS/tableRepLineBDG/INV","FCS_INV");
        mapaCampos.put("REP_LINE/FCS/tableRepLineBDG/GM","FCS_GM");
        mapaCampos.put("REP_LINE/FCS/tableRepLineBDG/VARPERC","VARPERC_FCS_QTY");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineBDG/QTY","BDG_QTY_MGT");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineBDG/GMPERC","BDG_GMPERC_MGT");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineBDG/INV","BDG_INV_MGT");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineBDG/GM","BDG_GM_MGT");
        mapaCampos.put("REP_LINE/Mgment Proposal/tableRepLineBDG/VARPERC","VARPERC_BDG_QTY_MGT");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineBDG/QTY","BDG_QTY_PM");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineBDG/GMPERC","BDG_GMPERC_PM");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineBDG/INV","BDG_INV_PM");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineBDG/GM","BDG_GM_PM");
        mapaCampos.put("REP_LINE/PM Proposal/tableRepLineBDG/VARPERC","BDG_GM_VARPERC");
        return mapaCampos;
    }


    public List getListParametros(){
        List prmtrsList = new ArrayList();
        prmtrsList.add(new SqlParameter("ROY_LYR_QTY",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_LYR_GM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_LYR_GMPERC",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_LYR_INV",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_QTY_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_GMPERC_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_INV_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_GM_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("VARPERC_ROY_QTY_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_QTY_PM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_GMPERC_PM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_INV_PM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_GM_PM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("VARPERC_ROY_QTY_PM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("FCS_QTY",Types.FLOAT));
        prmtrsList.add(new SqlParameter("FCS_GM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("FCS_GMPERC",Types.FLOAT));
        prmtrsList.add(new SqlParameter("FCS_INV",Types.FLOAT));
        prmtrsList.add(new SqlParameter("VARPERC_FCS_QTY",Types.FLOAT));
        prmtrsList.add(new SqlParameter("BDG_QTY_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("BDG_GMPERC_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("BDG_INV_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("BDG_GM_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("VARPERC_BDG_QTY_MGT",Types.FLOAT));
        prmtrsList.add(new SqlParameter("BDG_QTY_PM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("BDG_GMPERC_PM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("BDG_INV_PM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("BDG_GM_PM",Types.FLOAT));
        prmtrsList.add(new SqlParameter("BDG_GM_VARPERC",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_UNIT_COST",Types.FLOAT));
        prmtrsList.add(new SqlParameter("ROY_UNIT_INV",Types.FLOAT));
        prmtrsList.add(new SqlParameter("COMPANY",Types.VARCHAR));
        prmtrsList.add(new SqlParameter("PRINCIPAL_ERP_NUMBER",Types.VARCHAR));
        prmtrsList.add(new SqlParameter("PRINCIPAL_REPORTING_LINE",Types.VARCHAR));
        prmtrsList.add(new SqlParameter("BU_AGRUPADA",Types.VARCHAR));
        prmtrsList.add(new SqlParameter("UBT_LocalADUuser",Types.VARCHAR));
        return prmtrsList;
    }

}
