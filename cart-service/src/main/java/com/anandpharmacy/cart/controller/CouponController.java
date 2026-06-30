package com.anandpharmacy.cart.controller;

import java.util.Optional;
import org.springframework.web.bind.annotation.*;
import com.anandpharmacy.cart.entity.Coupon;
import com.anandpharmacy.cart.repo.CouponRepository;
import com.anandpharmacy.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Coupon Service", description = "Coupon management and validation endpoints.")
@RestController
@RequestMapping("/api/cart/coupons")
public class CouponController {

    private final CouponRepository couponRepository;

    public CouponController(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @Operation(summary = "Validate Coupon Code", description = "Validates a coupon code against active coupons in the database and returns its percentage and max discount limit.")
    @GetMapping("/validate/{code}")
    public ApiResponse<Coupon> validateCoupon(@PathVariable String code) {
        Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code);
        if (couponOpt.isPresent()) {
            return ApiResponse.ok("Coupon is valid", couponOpt.get());
        } else {
            return ApiResponse.fail("Invalid or expired coupon code");
        }
    }
}
