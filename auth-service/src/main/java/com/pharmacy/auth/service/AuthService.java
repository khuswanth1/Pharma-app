package com.pharmacy.auth.service;

import java.util.Map;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharmacy.auth.config.JwtService;
import com.pharmacy.auth.dto.AuthRequest;
import com.pharmacy.auth.dto.RegisterRequest;
import com.pharmacy.auth.dto.TokenResponse;
import com.pharmacy.auth.entity.AuthProvider;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repo.UserRepository;
import com.pharmacy.auth.service.GoogleTokenVerifier.GoogleProfile;
import com.pharmacy.common.Role;

/**
 * Core authentication use-cases: local registration/login, Google sign-in
 * (both server-verified ID token and browser OAuth2 provisioning) and password
 * recovery.
 */
@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;
    private final GoogleTokenVerifier googleVerifier;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder,
                       JwtService jwt, GoogleTokenVerifier googleVerifier) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
        this.googleVerifier = googleVerifier;
    }

    @Transactional
    public User register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        User u = new User();
        u.setName(req.name());
        u.setEmail(req.email());
        u.setPassword(passwordEncoder.encode(req.password()));
        u.setPhone(req.phone());
        u.setGender(req.gender());
        u.setProvider(AuthProvider.LOCAL);
        u.setRoles(req.roles() == null || req.roles().isEmpty() ? Set.of(Role.ROLE_USER) : req.roles());
        return users.save(u);
    }

    public TokenResponse login(AuthRequest req) {
        User u = users.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (u.getPassword() == null || !passwordEncoder.matches(req.password(), u.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        if (!u.isEnabled()) {
            throw new IllegalArgumentException("This account has been disabled");
        }
        return issueToken(u);
    }

    /** Server-side Google sign-in using a verified ID token from the browser. */
    @Transactional
    public TokenResponse loginWithGoogleIdToken(String idToken) {
        GoogleProfile profile = googleVerifier.verify(idToken);
        User u = provisionGoogleUser(profile.email(), profile.name(), profile.picture(), profile.sub());
        return issueToken(u);
    }

    /**
     * Finds or creates a user from Google profile data. Used by both the ID-token
     * flow and the Spring Security OAuth2 success handler.
     */
    @Transactional
    public User provisionGoogleUser(String email, String name, String picture, String providerId) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google account did not provide an email");
        }
        return users.findByEmail(email)
                .map(existing -> {
                    boolean changed = false;
                    if (picture != null && !picture.equals(existing.getPicture())) {
                        existing.setPicture(picture);
                        changed = true;
                    }
                    if (existing.getProviderId() == null && providerId != null) {
                        existing.setProviderId(providerId);
                        changed = true;
                    }
                    return changed ? users.save(existing) : existing;
                })
                .orElseGet(() -> {
                    User u = new User();
                    u.setName(name != null ? name : email.split("@")[0]);
                    u.setEmail(email);
                    u.setPicture(picture);
                    u.setProvider(AuthProvider.GOOGLE);
                    u.setProviderId(providerId);
                    u.setRoles(Set.of(Role.ROLE_USER));
                    return users.save(u);
                });
    }

    /** Verifies the email is registered before allowing a password reset. */
    public void verifyAccountExists(String email) {
        if (!users.existsByEmail(email)) {
            throw new IllegalArgumentException("This email address is not registered");
        }
    }

    @Transactional
    public void resetPassword(String email, String newPassword) {
        User u = users.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("This email address is not registered"));
        u.setPassword(passwordEncoder.encode(newPassword));
        if (u.getProvider() == null) {
            u.setProvider(AuthProvider.LOCAL);
        }
        users.save(u);
    }

    public TokenResponse issueToken(User u) {
        String token = jwt.generateToken(u.getId(), Map.of(
                "email", u.getEmail(),
                "roles", u.getRoles() == null ? Set.of() : u.getRoles()
        ));
        return new TokenResponse(token, u.getId());
    }
}
