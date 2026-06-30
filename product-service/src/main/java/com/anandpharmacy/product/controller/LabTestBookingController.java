package com.anandpharmacy.product.controller;

import org.springframework.web.bind.annotation.*;
import com.anandpharmacy.common.ApiResponse;
import com.anandpharmacy.product.entity.LabTestBooking;
import com.anandpharmacy.product.repo.LabTestBookingRepository;

import java.util.List;

@RestController
@RequestMapping("/api/products/lab-bookings")
public class LabTestBookingController {

    private final LabTestBookingRepository bookingRepository;

    public LabTestBookingController(LabTestBookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @PostMapping
    public ApiResponse<LabTestBooking> createBooking(@RequestBody LabTestBooking booking) {
        LabTestBooking saved = bookingRepository.save(booking);
        return ApiResponse.ok("Booking confirmed successfully", saved);
    }

    @GetMapping
    public ApiResponse<List<LabTestBooking>> getAllBookings() {
        return ApiResponse.ok("All bookings", bookingRepository.findAll());
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<LabTestBooking>> getBookingsByUser(@PathVariable String userId) {
        return ApiResponse.ok("User bookings", bookingRepository.findByUserId(userId));
    }

    @GetMapping("/slots")
    public ApiResponse<List<String>> getAvailableSlots() {
        List<String> slots = List.of(
            "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
            "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
            "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"
        );
        return ApiResponse.ok("Available time slots", slots);
    }
}
