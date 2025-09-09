package com.IMCDBudgetTool.controllers;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.sql.ResultSetMetaData;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/report")
public class ReportController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static Logger LOG = LoggerFactory.getLogger(SrProcessController.class);

    @GetMapping("/downloadExcel")
    public ResponseEntity excelTest(@RequestParam(value = "REPORT_NAME") String reportName,
                                    @RequestParam(value = "LocalADUser") String localAdUser,
                                    @RequestParam(value = "BUAGRUPADA") String buAgrupada) {
        try {

            Map<String, String> reportConfig = new HashMap<>();
            jdbcTemplate.query("{call dbo.Report_Catalog_Consult(?)}", new Object[]{reportName}, resultSet -> {
                ResultSetMetaData metaData = resultSet.getMetaData();
                for (int i = 1; i <= metaData.getColumnCount(); i++) {
                    reportConfig.put(metaData.getColumnLabel(i), resultSet.getString(i));
                }

            });
            /*POIFSFileSystem fs = new POIFSFileSystem(
                    new FileInputStream(reportConfig.get("RC_TemplatePath")));*/
            XSSFWorkbook wb = new XSSFWorkbook( new FileInputStream(reportConfig.get("RC_TemplatePath")));
            Object[] params = new Object[]{reportConfig.get("ObjectId")};
            Object[] params2 = new Object[]{reportConfig.get("ObjectId"), localAdUser, buAgrupada};
            XSSFSheet sheet = wb.getSheetAt(Integer.parseInt(reportConfig.get("RC_SheetData")));
            ArrayList<String> columnType = new ArrayList<>();

            XSSFCellStyle styleDec = wb.createCellStyle();
            styleDec.setAlignment(HorizontalAlignment.RIGHT);
            DataFormat format = wb.createDataFormat();
            styleDec.setDataFormat(format.getFormat("#,###,##0.00"));

            XSSFCellStyle styleInt = wb.createCellStyle();
            styleInt.setAlignment(HorizontalAlignment.RIGHT);
            DataFormat format1 = wb.createDataFormat();
            styleInt.setDataFormat(format1.getFormat("#,##0"));

            XSSFCellStyle styleDate = wb.createCellStyle();
            styleInt.setAlignment(HorizontalAlignment.RIGHT);
            DataFormat format2 = wb.createDataFormat();
            styleDate.setDataFormat(format2.getFormat("dd/mm/aaaa"));


            AtomicInteger rowid = new AtomicInteger();
            AtomicInteger cellId = new AtomicInteger();
            XSSFRow filaheader = sheet.createRow(rowid.getAndIncrement());
            jdbcTemplate.query("{call ObjectExcel_ConsultHeader(?)}", params, resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        String column_name = rsmd.getColumnName(1);
                        Cell celdaHeader = filaheader.createCell(cellId.getAndIncrement(), CellType.STRING);
                        String cellValueHeader = resultSet.getString(column_name);
                        sheet.autoSizeColumn(cellId.intValue());
                        celdaHeader.setCellValue(cellValueHeader);
                    }
            );

            jdbcTemplate.query("{call ObjectExcel_ConsultType(?)}", params, resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        String column_type = rsmd.getColumnName(1);
                        columnType.add(resultSet.getString(column_type));
                    }
            );

            jdbcTemplate.query("{call ObjectExcel_ConsultDownload(?,?,?)}", params2, resultSet ->
                    {
                        ResultSetMetaData rsmd = resultSet.getMetaData();
                        int numColumns = rsmd.getColumnCount();
                        Row fila = sheet.createRow(rowid.getAndIncrement());

                        for (int i = 0; i < numColumns; i++) {

                            if (Objects.equals(columnType.get(i), "String")) {
                                //CellStyle style = workbook.createCellStyle( );
                                String cellValue = resultSet.getString(i + 1);
                                Cell celda = fila.createCell(i, CellType.STRING);
                                celda.setCellValue((cellValue != null)?cellValue:"");
                                //celda.setCellStyle(style);

                            } else if (Objects.equals(columnType.get(i), "integer")) {
                                String cellValue = resultSet.getString(i + 1);
                                int cellValueI = (cellValue!= null)?Integer.parseInt(cellValue):0;
                                Cell celda = fila.createCell(i, CellType.NUMERIC);
                                celda.setCellStyle(styleInt);
                                celda.setCellValue(cellValueI);
                            } else if (Objects.equals(columnType.get(i), "date")) {
                                String cellValue = resultSet.getString(i + 1);
                                Cell celda = fila.createCell(i, CellType.FORMULA);
                                celda.setCellStyle(styleDate);
                                celda.setCellValue(cellValue);
                            } else {
                                String cellValue = resultSet.getString(i + 1);
                                float cellValueF = (cellValue!=null)?Float.parseFloat(cellValue) * 1000:0;
                                Cell celda = fila.createCell(i, CellType.NUMERIC);
                                celda.setCellStyle(styleDec);
                                celda.setCellValue(cellValueF / 1000);
                            }

                        }
                    }
            );

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            wb.close();

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMddmmss");
            LocalDateTime now = LocalDateTime.now();

            String fileName = "REPORT_" + reportConfig.get("RC_ReportId") + "_" + dtf.format(now) + ".xlsx";
            InputStreamResource file = new InputStreamResource(new ByteArrayInputStream(out.toByteArray()));


            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName )
                    .contentType(MediaType.parseMediaType("application/vnd.ms-excel"))
                    .body(file);

        } catch (IOException e) {
            throw new RuntimeException(e);
        }


    }

}
