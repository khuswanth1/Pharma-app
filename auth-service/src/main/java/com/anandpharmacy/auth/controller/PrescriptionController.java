package com.anandpharmacy.auth.controller;

import com.anandpharmacy.auth.dto.PrescriptionAnalyzeRequest;
import com.anandpharmacy.auth.dto.PrescriptionUploadRequest;
import com.anandpharmacy.auth.dto.PrescriptionUploadResponse;
import com.anandpharmacy.auth.service.PrescriptionService;
import com.anandpharmacy.common.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@Tag(name = "Prescriptions", description = "Upload and analyse medical prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    /**
     * Upload a prescription image (base64-encoded) and persist it.
     * POST /api/prescriptions
     */
    @PostMapping
    @Operation(summary = "Upload a prescription image")
    public ApiResponse<PrescriptionUploadResponse> upload(@RequestBody PrescriptionUploadRequest req) {
        if (req.image() == null || req.image().isBlank()) {
            return ApiResponse.fail("Prescription image is required.");
        }
        PrescriptionUploadResponse res = prescriptionService.savePrescription(
            req.image(),
            req.userId(),
            req.filename()
        );
        return ApiResponse.ok("Prescription uploaded successfully", res);
    }

    /**
     * Analyse a prescription image and return extracted medicine names.
     * POST /api/prescriptions/analyze
     */
    @PostMapping("/analyze")
    @Operation(summary = "Analyse a prescription and extract medicine names")
    public ApiResponse<List<String>> analyze(@RequestBody PrescriptionAnalyzeRequest req) {
        if (req.image() == null || req.image().isBlank()) {
            return ApiResponse.fail("Prescription image is required for analysis.");
        }
        List<String> medicines = prescriptionService.extractMedicines(req.image(), req.filename());
        return ApiResponse.ok("Prescription analysed successfully", medicines);
    }
}
