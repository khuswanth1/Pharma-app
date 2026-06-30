package com.anandpharmacy.auth.dto;

import java.time.LocalDateTime;

/** Response body for POST /api/prescriptions (upload) */
public record PrescriptionUploadResponse(
    String id,
    String imageUrl,
    LocalDateTime uploadedAt
) {}
