package com.anandpharmacy.product.service;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.anandpharmacy.product.entity.Product;
import com.anandpharmacy.product.repo.ProductRepository;

@Service
public class ProductService {
    private static final Logger log = LoggerFactory.getLogger(ProductService.class);
    private final ProductRepository productRepo;

    public ProductService(ProductRepository productRepo) {
        this.productRepo = productRepo;
    }

    @Transactional
    public void reduceStock(String productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        log.info("Stock Before | product={} stock={}", product.getName(), product.getStock());

        if (product.getStock() < quantity) {
            throw new IllegalArgumentException("Insufficient stock for product " + product.getName() + 
                ". Available: " + product.getStock() + ", Requested: " + quantity);
        }

        int stockAfter = product.getStock() - quantity;
        product.setStock(stockAfter);
        
        // Save the updated entity
        productRepo.save(product);

        log.info("Stock After | product={} stock={}", product.getName(), stockAfter);
    }
}
