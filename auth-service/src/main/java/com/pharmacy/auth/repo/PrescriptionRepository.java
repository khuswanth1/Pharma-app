package com.pharmacy.auth.repo;

import com.pharmacy.auth.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, String> {
    List<Prescription> findByUserIdOrderByUploadedAtDesc(String userId);
}
