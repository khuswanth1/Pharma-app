package com.pharmacy.cart.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import com.pharmacy.cart.entity.WishlistItem;
import com.pharmacy.cart.repo.WishlistRepository;
import com.pharmacy.common.ApiResponse;

@RestController
@RequestMapping("/api/cart/wishlist")
public class WishlistController {

    private final WishlistRepository repo;

    public WishlistController(WishlistRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/{userId}")
    public ApiResponse<Map<String, List<WishlistItem>>> getWishlists(@PathVariable String userId) {
        Map<String, List<WishlistItem>> grouped = new LinkedHashMap<>();
        // Pre-populate default wishlists to preserve UI tabs
        grouped.put("My Medicines", new ArrayList<>());
        grouped.put("Monthly Medicines", new ArrayList<>());
        grouped.put("Parents Medicines", new ArrayList<>());

        List<WishlistItem> items = repo.findByUserId(userId);
        for (WishlistItem item : items) {
            grouped.computeIfAbsent(item.getListName(), k -> new ArrayList<>()).add(item);
        }
        return ApiResponse.ok("Wishlists retrieved", grouped);
    }

    @PostMapping("/{userId}")
    public ApiResponse<WishlistItem> addToWishlist(@PathVariable String userId, @RequestBody WishlistItem item) {
        item.setUserId(userId);
        if (repo.existsByUserIdAndListNameAndProductId(userId, item.getListName(), item.getProductId())) {
            return ApiResponse.ok("Item already in wishlist", item);
        }
        return ApiResponse.ok("Item added to wishlist", repo.save(item));
    }

    @DeleteMapping("/{userId}/{listName}/{productId}")
    @Transactional
    public ApiResponse<Void> removeFromWishlist(
            @PathVariable String userId,
            @PathVariable String listName,
            @PathVariable String productId) {
        repo.deleteByUserIdAndListNameAndProductId(userId, listName, productId);
        return ApiResponse.ok("Item removed from wishlist", null);
    }

    @DeleteMapping("/{userId}/{listName}")
    @Transactional
    public ApiResponse<Void> deleteWishlist(
            @PathVariable String userId,
            @PathVariable String listName) {
        repo.deleteByUserIdAndListName(userId, listName);
        return ApiResponse.ok("Wishlist deleted", null);
    }
}
