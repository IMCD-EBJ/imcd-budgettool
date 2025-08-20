package com.IMCDBudgetTool.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.*;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class FileService {

    private static Logger LOG = LoggerFactory.getLogger(FileService.class);
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static Logger logger = LoggerFactory.getLogger(FileService.class);

    public void SaveFile(String fileName, ByteArrayOutputStream out) throws IOException {
        AtomicReference<String> CFG_DirectoryFilesUploadPrices = new AtomicReference<>("");

        try {
            InputStreamResource file = new InputStreamResource(new ByteArrayInputStream(out.toByteArray()));
            jdbcTemplate.query("{call dbo.Configuration_Consult()}", resultSet ->
                    {
                        CFG_DirectoryFilesUploadPrices.set(resultSet.getString("CFG_DirectoryFilesUploadPrices"));
                    }
            );

            if (CFG_DirectoryFilesUploadPrices.get() == null || CFG_DirectoryFilesUploadPrices.get() == "") {
                CFG_DirectoryFilesUploadPrices.set("jdeFiles");
            }

            Path root = Paths.get(CFG_DirectoryFilesUploadPrices.get());
            Path filePath = root.resolve(fileName).normalize();

            if (!Files.exists(root))
                Files.createDirectory(root);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        } catch (Exception e) {
            throw e;
        }
    }
    public Path saveFile(String paramBBDD, String fileName, MultipartFile file) throws IOException {
        AtomicReference<String> pathVariable = new AtomicReference<>("");

        jdbcTemplate.query("{call dbo.Configuration_Consult()}", resultSet ->
                {
                    pathVariable.set(resultSet.getString(paramBBDD));
                }
        );

        Path root = Paths.get(pathVariable.get());
        Path filePath = root.resolve(fileName).normalize();

        if (!Files.exists(root))
            Files.createDirectory(root);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filePath;

    }
    public ResponseEntity<Object> getFile(String paramBBDD, String fileName) throws IOException {
        try {
            AtomicReference<String> pathVariable = new AtomicReference<>("");

            jdbcTemplate.query("{call dbo.Configuration_Consult()}", resultSet ->
                    {
                        pathVariable.set(resultSet.getString(paramBBDD));
                    }
            );

            Path root = Paths.get(pathVariable.get());
            Path filePath = root.resolve(fileName).normalize();


            if (!Files.exists(filePath)) {
                throw new Exception("File not found " + fileName);
            }
            byte[] data = Files.readAllBytes(filePath);
            ByteArrayResource resource = new ByteArrayResource(data);

            return ResponseEntity.ok()
                    //.contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(resource);
        } catch (Exception e) {
            LOG.error("ERROR -> ", e);
            return new ResponseEntity<Object>(e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

    public void removeFiles(String paramBBDD, Integer ppcaId, Integer ppchId) throws Exception {
        AtomicReference<String> pathVariable = new AtomicReference<>("");

        jdbcTemplate.setResultsMapCaseInsensitive(true);
        Map<Integer, String> files = new HashMap<>();
        jdbcTemplate.query("{call PpcArchive_Consult(?,?)}", new Object[]{ppcaId, ppchId}, resultSet ->
                {
                    files.put(resultSet.getInt("PPCA_ID"),
                            resultSet.getString("PPCA_File"));
                }
        );


        jdbcTemplate.query("{call dbo.Configuration_Consult()}", resultSet ->
                {
                    pathVariable.set(resultSet.getString(paramBBDD));
                }
        );

        Path root = Paths.get(pathVariable.get());

        for (Map.Entry<Integer,String> file : files.entrySet())  {
            Path filePath = root.resolve(file.getValue()).normalize();
            if (!Files.exists(filePath)) {
                throw new Exception("File not found " + file.getValue());
            } else {
                Files.delete(filePath);
                jdbcTemplate.execute("{call PPCArchive_Delete(" + file.getKey() + ", "+ppchId+")}");
            }
        }

    }
}
