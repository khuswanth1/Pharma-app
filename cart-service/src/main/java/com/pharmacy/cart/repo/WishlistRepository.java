package com.pharmacy.cart.repo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.pharmacy.cart.entity.WishlistItem;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistItem, String> {
    List<WishlistItem> findByUserId(String userId);
    void deleteByUserIdAndListNameAndProductId(String userId, String listName, String productId);
    void deleteByUserIdAndListName(String userId, String listName);
    boolean existsByUserIdAndListNameAndProductId(String userId, String listName, String productId);
}
