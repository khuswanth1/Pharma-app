# Build stage: compile and package all modules
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copy root pom.xml and source code of all modules
COPY pom.xml .
COPY common-lib common-lib
COPY api-gateway api-gateway
COPY auth-service auth-service
COPY product-service product-service
COPY cart-service cart-service
COPY order-service order-service
COPY payment-service payment-service

# Package the entire project (builds common-lib first, then all microservices)
RUN mvn clean package -DskipTests

# Base runtime runner stage
FROM eclipse-temurin:21-jre AS runner
WORKDIR /app

# Auth Service target runner
FROM runner AS auth-service
COPY --from=build /app/auth-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java","-jar","/app/app.jar"]

# Product Service target runner
FROM runner AS product-service
COPY --from=build /app/product-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]

# Cart Service target runner
FROM runner AS cart-service
COPY --from=build /app/cart-service/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java","-jar","/app/app.jar"]

# Order Service target runner
FROM runner AS order-service
COPY --from=build /app/order-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java","-jar","/app/app.jar"]

# Payment Service target runner
FROM runner AS payment-service
COPY --from=build /app/payment-service/target/*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java","-jar","/app/app.jar"]

# API Gateway target runner (default target)
FROM runner AS api-gateway
COPY --from=build /app/api-gateway/target/*.jar app.jar
EXPOSE 8089
ENTRYPOINT ["java","-jar","/app/app.jar"]

