package com.pharmacy.auth.dto;

import java.util.Set;

import com.pharmacy.common.Gender;
import com.pharmacy.common.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required") String name,
        @Email(message = "A valid email is required") @NotBlank(message = "Email is required") String email,
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters long") String password,
        String phone,
        Gender gender,
        Set<Role> roles
) {}
