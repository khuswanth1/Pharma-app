package com.anandpharmacy.product.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.anandpharmacy.product.entity.LabTestBooking;
import java.util.List;

public interface LabTestBookingRepository extends JpaRepository<LabTestBooking, String> {
    List<LabTestBooking> findByUserId(String userId);
}
