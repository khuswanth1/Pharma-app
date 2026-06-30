package com.anandpharmacy.auth.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.anandpharmacy.auth.dto.AuthRequest;
import com.anandpharmacy.auth.dto.ForgotPasswordRequest;
import com.anandpharmacy.auth.dto.GoogleLoginRequest;
import com.anandpharmacy.auth.dto.RegisterRequest;
import com.anandpharmacy.auth.dto.ResetPasswordRequest;
import com.anandpharmacy.auth.dto.TokenResponse;
import com.anandpharmacy.auth.dto.UpdateProfileRequest;
import com.anandpharmacy.auth.dto.UserResponse;
import com.anandpharmacy.auth.entity.User;
import com.anandpharmacy.auth.service.AuthService;
import com.anandpharmacy.auth.service.ProfileService;
import com.anandpharmacy.common.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Login, registration, Google sign-in and profile management")
public class AuthController {

    private final AuthService authService;
    private final ProfileService profileService;
    private final String googleAuthorizationUrl;
    private final String googleCallbackUrl;

    public AuthController(
            AuthService authService,
            ProfileService profileService,
            @Value("${app.oauth2.authorization-url:/oauth2/authorization/google}") String googleAuthorizationUrl,
            @Value("${app.oauth2.callback-url:/login/oauth2/code/google}") String googleCallbackUrl) {
        this.authService = authService;
        this.profileService = profileService;
        this.googleAuthorizationUrl = googleAuthorizationUrl;
        this.googleCallbackUrl = googleCallbackUrl;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new local account")
    public ApiResponse<Map<String, String>> register(@RequestBody @Valid RegisterRequest req) {
        User u = authService.register(req);
        return ApiResponse.ok("User registered successfully",
                Map.of("id", u.getId(), "email", u.getEmail()));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate with email and password")
    public ApiResponse<TokenResponse> login(@RequestBody @Valid AuthRequest req) {
        return ApiResponse.ok("Login successful", authService.login(req));
    }

    @GetMapping("/google")
    @Operation(summary = "Discover the Google OAuth2 redirect endpoint")
    public ApiResponse<Map<String, String>> googleEndpoint() {
        return ApiResponse.ok("Redirect the browser to start Google sign-in", Map.of(
                "endpoint", googleAuthorizationUrl,
                "callback", googleCallbackUrl
        ));
    }

    @PostMapping("/google")
    @Operation(summary = "Sign in with a Google ID token (Google Identity Services)")
    public ApiResponse<TokenResponse> googleLogin(@RequestBody GoogleLoginRequest req) {
        TokenResponse token;
        if (req.idToken() != null && !req.idToken().isBlank()) {
            token = authService.loginWithGoogleIdToken(req.idToken());
        } else if (req.email() != null && !req.email().isBlank()) {
            User u = authService.provisionGoogleUser(req.email(), req.name(), null, null);
            token = authService.issueToken(u);
        } else {
            throw new IllegalArgumentException("Either idToken or email must be provided");
        }
        return ApiResponse.ok("Google login successful", token);
    }

    @GetMapping("/profile/{id}")
    @Operation(summary = "Fetch a user's profile")
    public ApiResponse<UserResponse> getProfile(@PathVariable String id) {
        return ApiResponse.ok("Profile", UserResponse.from(profileService.getById(id)));
    }

    @PutMapping("/profile/{id}")
    @Operation(summary = "Update a user's profile")
    public ApiResponse<UserResponse> updateProfile(@PathVariable String id,
                                                   @RequestBody UpdateProfileRequest req) {
        return ApiResponse.ok("Profile updated", UserResponse.from(profileService.update(id, req)));
    }

    @PostMapping("/wallet/{id}/add")
    @Operation(summary = "Atomically add an amount to a user's wallet balance")
    public ApiResponse<UserResponse> addWalletBalance(@PathVariable String id,
                                                      @RequestBody Map<String, Object> body) {
        double amount = ((Number) body.get("amount")).doubleValue();
        return ApiResponse.ok("Wallet balance updated", UserResponse.from(profileService.addWalletBalance(id, amount)));
    }

    @PostMapping("/forgot")
    @Operation(summary = "Verify an email is registered before password reset")
    public ApiResponse<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequest req) {
        authService.verifyAccountExists(req.email());
        return ApiResponse.ok("Account verified. You may now reset your password.", null);
    }

    @PostMapping("/reset")
    @Operation(summary = "Set a new password for a registered account")
    public ApiResponse<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest req) {
        authService.resetPassword(req.email(), req.password());
        return ApiResponse.ok("Password reset successfully", null);
    }
}
