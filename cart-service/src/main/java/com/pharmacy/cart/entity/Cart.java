package com.pharmacy.cart.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;

@Entity
public class Cart {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String userId;
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "cart_item", joinColumns = @JoinColumn(name = "cart_id"))
    private List<CartItem> items = new ArrayList<>();

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<CartItem> getItems() { return items; }
}
