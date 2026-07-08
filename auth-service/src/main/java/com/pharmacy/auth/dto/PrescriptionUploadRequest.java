package com.pharmacy.auth.dto;

/** Request body for POST /api/prescriptions */
public record PrescriptionUploadRequest(
    /** Base64-encoded image string (data:image/jpeg;base64,...) */
    String image,
    /** Optional user ID to associate the prescription with */
    String userId,
    /** Original filename */
    String filename
) {}
