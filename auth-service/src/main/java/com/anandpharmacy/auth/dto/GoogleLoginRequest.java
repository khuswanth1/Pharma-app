package com.anandpharmacy.auth.dto;

/**
 * Payload for client-side Google sign-in (Google Identity Services / One-Tap).
 * Either an {@code idToken} (preferred, verified server-side) or a basic
 * {@code email}/{@code name} pair can be supplied.
 */
public record GoogleLoginRequest(String idToken, String email, String name) {}
