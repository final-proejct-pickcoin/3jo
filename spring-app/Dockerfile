FROM gradle:7.5-jdk17 AS build

USER root
WORKDIR /home/gradle/app
COPY . .

# Gradle 캐시/프로젝트 디렉토리 권한 수정
RUN mkdir -p /home/gradle/.gradle && chown -R gradle:gradle /home/gradle

USER gradle
# 로컬과 동일하게 gradlew 실행 (프로젝트 내 wrapper 사용)
RUN ./gradlew --no-daemon clean build -x test

FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /home/gradle/app/build/libs/*.war app.war
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.war"]
