package com.anandpharmacy.auth.dto;

/** Request body for POST /api/prescriptions/analyze */
public record PrescriptionAnalyzeRequest(
    /** Base64-encoded image string */
    String image,
    /** Original filename — used for keyword extraction when no OCR is available */
    String filename
) {}
