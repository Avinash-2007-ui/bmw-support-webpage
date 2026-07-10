# Stage 1: Build the code using the full Java Development Kit (JDK)
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY BmwBackend.java .
# Compile the raw source code into a standard bytecode .class file
RUN javac BmwBackend.java

# Stage 2: Run the code using the lightweight Runtime Environment (JRE)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the compiled .class file from the build stage
COPY --from=build /app/BmwBackend*.class .
EXPOSE 8080
# Run the compiled bytecode directly
ENTRYPOINT ["java", "BmwBackend"]