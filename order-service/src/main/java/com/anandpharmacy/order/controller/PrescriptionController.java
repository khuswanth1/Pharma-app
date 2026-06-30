package com.anandpharmacy.order.controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import com.anandpharmacy.common.ApiResponse;
import com.anandpharmacy.order.entity.Prescription;
import com.anandpharmacy.order.repo.PrescriptionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/prescriptions")
@Tag(name = "Prescription Management", description = "Endpoints for uploading and viewing user medical prescriptions")
public class PrescriptionController {

    private final PrescriptionRepository prescriptionRepository;

    public PrescriptionController(PrescriptionRepository prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }

    @PostMapping
    @Operation(summary = "Upload a new prescription (Base64 encoded)")
    public ApiResponse<Prescription> uploadPrescription(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Map<String, String> payload) {
        
        String resolvedUserId = (userId != null && !userId.isBlank()) ? userId : "guest-user";
        String base64Image = payload.get("image");
        
        if (base64Image == null || base64Image.isBlank()) {
            throw new IllegalArgumentException("Prescription image data is required");
        }

        Prescription prescription = new Prescription();
        prescription.setUserId(resolvedUserId);
        prescription.setImageUrl(base64Image);
        
        Prescription saved = prescriptionRepository.save(prescription);
        return ApiResponse.ok("Prescription uploaded successfully", saved);
    }

    @PostMapping("/analyze")
    @Operation(summary = "Analyze a prescription image using mock OCR to extract medicine names")
    public ApiResponse<List<String>> analyzePrescription(@RequestBody Map<String, String> payload) {
        try {
            String base64Image = payload.get("image");
            String filename = payload.get("filename");
            
            if (base64Image == null || base64Image.isBlank()) {
                throw new IllegalArgumentException("Prescription image data is required");
            }

            // Simulating OCR extraction: parse the base64 string or filename text.
            List<String> matchedMedicines = new java.util.ArrayList<>();
            String rawText = base64Image.toLowerCase();
            String nameText = filename != null ? filename.toLowerCase() : "";
            
            if (rawText.contains("dolo") || rawText.contains("para") || nameText.contains("dolo") || nameText.contains("para") || nameText.contains("cold") || nameText.contains("cough")) {
                matchedMedicines.add("Dolo 650 Tablet");
            }
            if (rawText.contains("metformin") || rawText.contains("glyc") || nameText.contains("metformin") || nameText.contains("glyc") || nameText.contains("diabetes") || nameText.contains("sugar")) {
                matchedMedicines.add("Metformin 500mg");
            }
            if (rawText.contains("panto") || rawText.contains("gas") || nameText.contains("panto") || nameText.contains("gas") || nameText.contains("acidity") || nameText.contains("acid")) {
                matchedMedicines.add("Pantocid 40mg");
            }
            
            // Default list if no explicit matches are detected
            if (matchedMedicines.isEmpty()) {
                matchedMedicines.add("Dolo 650 Tablet");
                matchedMedicines.add("Metformin 500mg");
                matchedMedicines.add("Pantocid 40mg");
                matchedMedicines.add("Zincovit Tablet");
            }

            return ApiResponse.ok("Prescription analyzed successfully", matchedMedicines);
        } catch (Exception ex) {
            System.err.println("Error in analyzePrescription: " + ex.getMessage());
            ex.printStackTrace();
            return ApiResponse.ok("Analysis error occurred", java.util.List.of("Error: " + ex.getClass().getName() + " - " + ex.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Retrieve prescription upload history for a user")
    public ApiResponse<List<Prescription>> getPrescriptionsByUser(@PathVariable String userId) {
        List<Prescription> list = prescriptionRepository.findByUserId(userId);
        return ApiResponse.ok("User prescriptions retrieved successfully", list);
    }
}
