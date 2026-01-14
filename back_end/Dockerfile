# Dockerfile for Spring Boot Backend
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy the source code
COPY . .

# Build with Maven
RUN ./mvnw clean package -DskipTests

# Run the application
CMD ["java", "-jar", "target/*.jar"]