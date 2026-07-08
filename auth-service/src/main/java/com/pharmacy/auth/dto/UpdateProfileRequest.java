package com.pharmacy.auth.dto;

import com.pharmacy.common.Gender;

/**
 * Partial profile update. Any {@code null} field is left unchanged.
 */
public record UpdateProfileRequest(
        String name,
        String phone,
        String address,
        String geolocation,
        Gender gender,
        String picture,
        String email,
        Double walletBalance
) {}
