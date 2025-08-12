#AS로 임시 컨테이너 생성
FROM gradle:7.5-jdk17 AS build

USER root
#작업디렉토리 설정
WORKDIR /home/gradle/app
#설정한 작업 디렉토리에 spring-app 프로젝트 폴더 통으로 복사
COPY . .
# Gradle 캐시/프로젝트 디렉토리 권한 수정
RUN mkdir -p /home/gradle/.gradle && chown -R gradle:gradle /home/gradle

USER gradle
# 로컬과 동일하게 gradlew 실행 (프로젝트 내 wrapper 사용)
# RUN ./gradlew --no-daemon clean build -x test
RUN ./gradlew --no-daemon clean build

#본 컨테이너 생성
FROM openjdk:17-jdk-slim
WORKDIR /app
#임시 컨테이너에서의 빌드파일 복사
COPY --from=build /home/gradle/app/build/libs/*.war app.war
#8080포트개방
EXPOSE 8080
#빌드파일 실행
ENTRYPOINT ["java", "-jar", "/app/app.war"]
