package com.pharmacy.auth.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.pharmacy.auth.dto.TokenResponse;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.service.AuthService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Completes the browser-based Google OAuth2 flow: provisions/looks up the local
 * user, issues a JWT, and redirects the browser back to the React app with the
 * token and user id as query parameters (consumed by {@code Login.jsx}).
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final String redirectUri;

    public OAuth2LoginSuccessHandler(
            AuthService authService,
            @Value("${app.oauth2.success-redirect-uri:http://localhost:3000/login}") String redirectUri) {
        this.authService = authService;
        this.redirectUri = redirectUri;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");
        String picture = principal.getAttribute("picture");
        String sub = principal.getAttribute("sub");

        User user = authService.provisionGoogleUser(email, name, picture, sub);
        TokenResponse token = authService.issueToken(user);

        String target = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", token.token())
                .queryParam("userId", token.userId())
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUriString();

        response.sendRedirect(target);
    }
}
