package com.anandpharmacy.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @Email(message = "A valid email is required") @NotBlank(message = "Email is required") String email
) {}
