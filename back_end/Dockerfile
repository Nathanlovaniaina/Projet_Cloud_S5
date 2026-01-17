# Dockerfile for Spring Boot Backend
# Use Eclipse Temurin JDK (stable, maintained)
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy the source code
COPY . .

# Build with Maven (if pom.xml exists)
RUN if [ -f pom.xml ]; then mvn clean package -DskipTests; else echo "No pom.xml found - skipping build"; fi

# Run the application (placeholder - adjust once you have a JAR)
CMD ["sh", "-c", "if [ -f target/*.jar ]; then java -jar target/*.jar; else echo 'Backend not ready - add Spring Boot code to back_end/'; sleep infinity; fi"]