package com.pharmacy.cart.config;

import com.pharmacy.cart.entity.Coupon;
import com.pharmacy.cart.repo.CouponRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class CouponDataInitializer {

    @Bean
    CommandLineRunner initCoupons(CouponRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                List<Coupon> initialCoupons = List.of(
                    new Coupon("WELCOME20", 0.20, 200.0, "Save 20% on your medicine (Up to ₹200)"),
                    new Coupon("FIRSTORDER", 0.10, 500.0, "Save 10% on entire purchase!"),
                    new Coupon("KUSHU100", 0.25, 100.0, "Save 25% on your medicine (Up to ₹100)"),
                    new Coupon("PHARMA123", 0.15, 300.0, "Save 15% on your medicine (Up to ₹300)"),
                    new Coupon("RAO100", 0.30, 100.0, "Save 30% on your medicine (Up to ₹100)"),
                    new Coupon("ANAND50", 0.05, 50.0, "Save 5% on your medicine (Up to ₹50)"),
                    new Coupon("HEALTHY20", 0.20, 250.0, "Save 20% on health items (Up to ₹250)"),
                    new Coupon("MEDS15", 0.15, 150.0, "Save 15% on prescription drugs (Up to ₹150)"),
                    new Coupon("SUPER200", 0.12, 200.0, "Save 12% on super orders (Up to ₹200)"),
                    new Coupon("SAVE10", 0.10, 100.0, "Save 10% on your transaction (Up to ₹100)")
                );
                repository.saveAll(initialCoupons);
                System.out.println("Initialized 10 standard coupon codes in DB.");
            }
        };
    }
}
