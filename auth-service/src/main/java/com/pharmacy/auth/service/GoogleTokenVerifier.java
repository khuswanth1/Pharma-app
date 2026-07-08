package com.pharmacy.auth.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Verifies Google ID tokens (issued by Google Identity Services on the client)
 * against Google's public {@code tokeninfo} endpoint and asserts the audience
 * matches our configured OAuth2 client id.
 *
 * <p>This keeps server-side Google sign-in dependency-free; the browser-based
 * OAuth2 Authorization Code flow handled by Spring Security remains the primary
 * path used by the React app.
 */
@Service
public class GoogleTokenVerifier {

    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final RestClient restClient = RestClient.create();
    private final String clientId;

    public GoogleTokenVerifier(
            @Value("${spring.security.oauth2.client.registration.google.client-id:}") String clientId) {
        this.clientId = clientId;
    }

    /**
     * @return the verified Google profile claims (sub, email, name, picture).
     * @throws IllegalArgumentException if the token is invalid or for the wrong audience.
     */
    @SuppressWarnings("unchecked")
    public GoogleProfile verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Missing Google ID token");
        }
        Map<String, Object> claims;
        try {
            claims = restClient.get()
                    .uri(TOKEN_INFO_URL + "?id_token={t}", idToken)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Could not verify Google token");
        }
        if (claims == null || claims.get("email") == null) {
            throw new IllegalArgumentException("Invalid Google token");
        }
        String audience = String.valueOf(claims.get("aud"));
        if (clientId != null && !clientId.isBlank() && !clientId.equals(audience)) {
            throw new IllegalArgumentException("Google token audience mismatch");
        }
        return new GoogleProfile(
                String.valueOf(claims.get("sub")),
                String.valueOf(claims.get("email")),
                claims.get("name") != null ? String.valueOf(claims.get("name")) : null,
                claims.get("picture") != null ? String.valueOf(claims.get("picture")) : null
        );
    }

    public record GoogleProfile(String sub, String email, String name, String picture) {}
}
