package com.pharmacy.gateway;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class SecurityRouteFilter implements GlobalFilter, Ordered {

    @Value("${app.jwt-secret:pharmacy_super_secret_key_please_change}")
    private String jwtSecret;

    private static final List<String> PUBLIC_PATHS = List.of(
        "/actuator", "/swagger-ui", "/v3/api-docs", "/api-docs", "/webjars", "/hello", "/asyncapi.yaml",
        "/api/auth/login", "/api/auth/register", "/api/auth/google",
        "/api/auth/forgot", "/api/auth/reset",
        "/api/auth/geocode",
        "/api/auth/wallet",
        "/api/cart/coupons/validate",
        "/api/products",
        "/api/prescriptions",
        "/api/orders",
        "/api/payments",
        "/oauth2", "/login"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Let CORS preflight requests through untouched.
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

        var path = exchange.getRequest().getURI().getPath();
        if (PUBLIC_PATHS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        String auth = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (auth == null || !auth.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        try {
            var key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(auth.substring(7)).getPayload();
            exchange.getRequest().mutate().header("X-User-Id", claims.getSubject()).build();
            return chain.filter(exchange);
        } catch (Exception ex) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
