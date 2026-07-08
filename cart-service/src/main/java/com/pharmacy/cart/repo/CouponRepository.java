package com.pharmacy.cart.repo;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.pharmacy.cart.entity.Coupon;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeIgnoreCaseAndActiveTrue(String code);
}
