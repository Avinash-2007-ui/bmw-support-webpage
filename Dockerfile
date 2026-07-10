FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY BmwBackend.java .
EXPOSE 8080
ENTRYPOINT ["java", "BmwBackend.java"]