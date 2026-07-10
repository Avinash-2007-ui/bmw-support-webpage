# Use a secure, lightweight OpenJDK runtime base image matching your current version
FROM eclipse-temurin:21-jre-alpine

# Set a functional folder path for the sandbox file system
WORKDIR /app

# Copy the compiled executable application JAR layer into the container
COPY target/BmwBackend.jar app.jar

# Expose the internal port loop dynamically mapped by Google Cloud
EXPOSE 8080

# Execute the binary process engine upon container activation
ENTRYPOINT ["java", "-jar", "app.jar"]