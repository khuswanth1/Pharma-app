package com.anandpharmacy.cart.repo;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.anandpharmacy.cart.entity.Coupon;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeIgnoreCaseAndActiveTrue(String code);
}
