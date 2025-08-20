FROM openjdk
VOLUME /tmp
COPY target/*.jar app.jar
EXPOSE 8080
EXPOSE 49154
ENTRYPOINT ["java","-jar","/app.jar"]