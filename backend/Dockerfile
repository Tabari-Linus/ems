# syntax=docker/dockerfile:1

# ---------- Build: compile and package with Maven on JDK 21 ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Resolve dependencies in their own layer so source-only changes reuse it.
COPY pom.xml lombok.config ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q package -DskipTests \
 && cp target/*.jar application.jar

# Split the Spring Boot jar into layers (dependencies change far less often than app code).
RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted

# ---------- Runtime: JRE only, non-root ----------
FROM eclipse-temurin:21-jre

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 10001 ems \
 && useradd --system --uid 10001 --gid ems --no-create-home --shell /usr/sbin/nologin ems

WORKDIR /application

COPY --from=build /workspace/extracted/dependencies/ ./
COPY --from=build /workspace/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/extracted/application/ ./

USER ems:ems

# Container-aware heap sizing; override or extend at runtime with JAVA_OPTS.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError" \
    PORT=8080

# JWT keys are NOT baked in: mount them (e.g. at /run/keys) and set
# JWT_PRIVATE_KEY_PATH / JWT_PUBLIC_KEY_PATH, or pass JWT_PRIVATE_KEY / JWT_PUBLIC_KEY as PEM.
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=90s --retries=5 \
    CMD curl -fsS "http://localhost:${PORT}/actuator/health/liveness" || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar application.jar"]
