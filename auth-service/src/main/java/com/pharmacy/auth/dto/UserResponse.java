package com.pharmacy.auth.dto;

import java.util.Set;

import com.pharmacy.auth.entity.AuthProvider;
import com.pharmacy.auth.entity.User;
import com.pharmacy.common.Gender;
import com.pharmacy.common.Role;

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
