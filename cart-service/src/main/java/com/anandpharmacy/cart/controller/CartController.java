package com.anandpharmacy.cart.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.*;
import com.anandpharmacy.cart.entity.Cart;
import com.anandpharmacy.cart.entity.CartItem;
import com.anandpharmacy.cart.repo.CartRepository;
import com.anandpharmacy.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Cart Service", description = "Shopping cart management endpoints for adding/removing medicines and saving patient notes.")
@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final CartRepository repo;
    public CartController(CartRepository repo) { this.repo = repo; }

    @Operation(summary = "Get User Cart", description = "Retrieves the shopping cart for a specific user ID, creating one if it doesn't exist.")
    @GetMapping("/{userId}")
    public ApiResponse<Cart> get(@PathVariable String userId) {
        return ApiResponse.ok("Cart", repo.findByUserId(userId).orElseGet(() -> {
            Cart c = new Cart();
            c.setUserId(userId);
            return repo.save(c);
        }));
    }

    @Operation(summary = "Add Item to Cart", description = "Adds a medicine item to the user's cart or updates it, supporting quantity, price, and custom patient notes.")
    @PostMapping("/{userId}/items")
    public ApiResponse<Cart> add(@PathVariable String userId, @RequestBody CartItem item) {
        Cart cart = repo.findByUserId(userId).orElseGet(() -> {
            Cart c = new Cart();
            c.setUserId(userId);
            return c;
        });
        cart.getItems().removeIf(i -> i.getProductId().equals(item.getProductId()));
        cart.getItems().add(item);
        return ApiResponse.ok("Item added", repo.save(cart));
    }

    @Operation(summary = "Remove Item from Cart", description = "Deletes a specific product item from the user's cart by product ID.")
    @DeleteMapping("/{userId}/items/{productId}")
    public ApiResponse<?> remove(@PathVariable String userId, @PathVariable String productId) {
        Cart cart = repo.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        cart.getItems().removeIf(i -> i.getProductId().equals(productId));
        repo.save(cart);
        return ApiResponse.ok("Item removed", Map.of("userId", userId, "productId", productId));
    }

    @Operation(summary = "Clear Cart", description = "Removes all items from the user's cart.")
    @DeleteMapping("/{userId}/clear")
    public ApiResponse<?> clear(@PathVariable String userId) {
        Cart cart = repo.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        cart.getItems().clear();
        repo.save(cart);
        return ApiResponse.ok("Cart cleared", Map.of("userId", userId));
    }
}
