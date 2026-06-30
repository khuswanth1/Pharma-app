package com.anandpharmacy.auth.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.web.util.UriComponentsBuilder;

import com.anandpharmacy.auth.security.OAuth2LoginSuccessHandler;

@Configuration
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler oauth2SuccessHandler;
    private final String oauthRedirectUri;

    public SecurityConfig(OAuth2LoginSuccessHandler oauth2SuccessHandler,
                          @Value("${app.oauth2.success-redirect-uri:http://localhost:3000/login}") String oauthRedirectUri) {
        this.oauth2SuccessHandler = oauth2SuccessHandler;
        this.oauthRedirectUri = oauthRedirectUri;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/**",
                    "/api/prescriptions/**",
                    "/oauth2/**",
                    "/login/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/actuator/**"
                ).permitAll()
                .anyRequest().authenticated())
            .oauth2Login(oauth -> oauth
                .successHandler(oauth2SuccessHandler)
                .failureHandler(oauth2FailureHandler()));
        return http.build();
    }

    /** On OAuth2 failure, bounce back to the React app with an error flag. */
    private AuthenticationFailureHandler oauth2FailureHandler() {
        return (request, response, exception) -> redirectWithError(response);
    }

    private void redirectWithError(jakarta.servlet.http.HttpServletResponse response) throws IOException {
        String target = UriComponentsBuilder.fromUriString(oauthRedirectUri)
                .queryParam("error", "google_auth_failed")
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUriString();
        response.sendRedirect(target);
    }
}
