package com.anandpharmacy.product.repo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.anandpharmacy.product.entity.Category;
import com.anandpharmacy.product.entity.Product;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByNameContainingIgnoreCase(String q);
    List<Product> findByCategory(Category category);
    List<Product> findByRatingGreaterThanEqual(double rating);
}
