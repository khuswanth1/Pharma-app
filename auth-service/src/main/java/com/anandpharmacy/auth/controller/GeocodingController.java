package com.anandpharmacy.auth.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import com.anandpharmacy.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/auth/geocode")
@Tag(name = "Geocoding", description = "Geocoding and reverse geocoding using Geoapify")
public class GeocodingController {

    private final String apiKey;
    private final RestTemplate restTemplate = new RestTemplate();

    public GeocodingController(@org.springframework.beans.factory.annotation.Value("${app.geoapify-key}") String apiKey) {
        this.apiKey = apiKey;
    }

    @GetMapping("/search")
    @Operation(summary = "Forward geocoding (text to coordinates/address)")
    public ApiResponse<Object> search(@RequestParam String text) {
        try {
            String encodedText = URLEncoder.encode(text, StandardCharsets.UTF_8);
            String url = String.format("https://api.geoapify.com/v1/geocode/search?text=%s&apiKey=%s", encodedText, apiKey);
            Object response = restTemplate.getForObject(url, Object.class);
            return ApiResponse.ok("Geocode search successful", response);
        } catch (Exception e) {
            return ApiResponse.fail("Geocode search failed: " + e.getMessage());
        }
    }

    @GetMapping("/reverse")
    @Operation(summary = "Reverse geocoding (coordinates to address)")
    public ApiResponse<Object> reverse(@RequestParam Double lat, @RequestParam Double lng) {
        try {
            String url = String.format("https://api.geoapify.com/v1/geocode/reverse?lat=%f&lon=%f&apiKey=%s", lat, lng, apiKey);
            Object response = restTemplate.getForObject(url, Object.class);
            return ApiResponse.ok("Reverse geocode successful", response);
        } catch (Exception e) {
            return ApiResponse.fail("Reverse geocode failed: " + e.getMessage());
        }
    }
}
