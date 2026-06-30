package com.anandpharmacy.order.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.anandpharmacy.common.OrderStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String userId;
    private BigDecimal totalAmount;
    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.CREATED;
    private LocalDateTime createdAt = LocalDateTime.now();

    private String receiverName;
    private String phoneNumber;
    @Column(length = 1000)
    private String address;
    @Column(length = 1000)
    private String deliveryInstructions;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private List<OrderItem> items = new ArrayList<>();

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getDeliveryInstructions() { return deliveryInstructions; }
    public void setDeliveryInstructions(String deliveryInstructions) { this.deliveryInstructions = deliveryInstructions; }
}
