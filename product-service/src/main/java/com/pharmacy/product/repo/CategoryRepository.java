package com.pharmacy.product.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.pharmacy.product.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, String> {
    Category findBySlugIgnoreCase(String slug);
}
