package com.anandpharmacy.auth.dto;

import java.util.Set;

import com.anandpharmacy.auth.entity.AuthProvider;
import com.anandpharmacy.auth.entity.User;
import com.anandpharmacy.common.Gender;
import com.anandpharmacy.common.Role;

/**
 * Public-facing view of a {@link User} (never exposes the password hash).
 */
public record UserResponse(
        String id,
        String name,
        String email,
        String phone,
        String address,
        String geolocation,
        String picture,
        Gender gender,
        AuthProvider provider,
        Set<Role> roles,
        double walletBalance
) {
    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getPhone(),
                u.getAddress(),
                u.getGeolocation(),
                u.getPicture(),
                u.getGender(),
                u.getProvider(),
                u.getRoles(),
                u.getWalletBalance()
        );
    }
}
