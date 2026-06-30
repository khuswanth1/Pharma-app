package com.anandpharmacy.auth.dto;

/**
 * Returned by login / Google sign-in. The frontend persists the JWT and then
 * fetches the full profile using {@code userId}.
 */
public record TokenResponse(String token, String userId) {}
