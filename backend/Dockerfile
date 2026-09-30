FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /workspace
COPY pom.xml ./
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S randyflow && adduser -S randyflow -G randyflow \
    && mkdir -p /data/uploads && chown -R randyflow:randyflow /data
WORKDIR /app
COPY --from=build /workspace/target/randyflow-backend-*.jar app.jar
USER randyflow
ENV SPRING_PROFILES_ACTIVE=prod \
    STORAGE_PATH=/data/uploads
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
