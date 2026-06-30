package com.anandpharmacy.product.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lab_test_bookings")
public class LabTestBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String testName;
    private Double price;
    private String selectedDate;
    private String selectedSlot;
    private String userId;
    private String patientName;
    private String patientPhone;
    private String status = "BOOKED"; // BOOKED, CANCELLED, COMPLETED
    private LocalDateTime createdAt = LocalDateTime.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getSelectedDate() { return selectedDate; }
    public void setSelectedDate(String selectedDate) { this.selectedDate = selectedDate; }

    public String getSelectedSlot() { return selectedSlot; }
    public void setSelectedSlot(String selectedSlot) { this.selectedSlot = selectedSlot; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
