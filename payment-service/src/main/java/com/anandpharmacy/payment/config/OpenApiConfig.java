package com.anandpharmacy.payment.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI paymentServiceOpenAPI(
            @Value("${app.gateway-url:http://localhost:8089}") String gatewayUrl) {
        return new OpenAPI()
                .servers(List.of(new Server().url(gatewayUrl).description("API Gateway")))
                .info(new Info()
                .title("Pharmacy - Payment Service API")
                .description("Transaction and payment processing endpoints.")
                .version("1.0.0")
                .contact(new Contact().name("Pharmacy"))
                .license(new License().name("Proprietary")));
    }
}
