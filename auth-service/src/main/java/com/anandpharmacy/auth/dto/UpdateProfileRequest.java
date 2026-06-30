package com.anandpharmacy.auth.dto;

import com.anandpharmacy.common.Gender;

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
