package com.pharmacy.cart.repo;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.pharmacy.cart.entity.Cart;

public interface CartRepository extends JpaRepository<Cart, String> {
    Optional<Cart> findByUserId(String userId);
}
