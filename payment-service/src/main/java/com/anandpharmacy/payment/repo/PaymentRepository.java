package com.anandpharmacy.payment.repo;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.anandpharmacy.payment.entity.PaymentEntity;

public interface PaymentRepository extends JpaRepository<PaymentEntity, String> {
    Optional<PaymentEntity> findByRazorpayOrderId(String razorpayOrderId);
    Optional<PaymentEntity> findByOrderId(String orderId);
}
