package com.pharmacy.order.controller;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import com.pharmacy.common.ApiResponse;
import com.pharmacy.order.entity.OrderEntity;
import com.pharmacy.order.repo.OrderRepository;
import com.pharmacy.order.service.OrderService;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderRepository repo;
    private final OrderService orderService;

    public OrderController(OrderRepository repo, OrderService orderService) { 
        this.repo = repo; 
        this.orderService = orderService;
    }

    @PostMapping
    public ApiResponse<OrderEntity> create(@RequestBody OrderEntity order) {
        return ApiResponse.ok("Order created", orderService.createOrder(order));
    }

    @GetMapping("/{userId}")
    public ApiResponse<List<OrderEntity>> byUser(@PathVariable String userId) {
        return ApiResponse.ok("Orders", repo.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/detail/{orderId}")
    public ApiResponse<OrderEntity> getOrderById(@PathVariable String orderId) {
        return ApiResponse.ok("Order found", repo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId)));
    }

    @PatchMapping("/{orderId}/status")
    public ApiResponse<?> updateStatus(@PathVariable String orderId, @RequestParam String status) {
        OrderEntity order = orderService.updateStatus(orderId, com.pharmacy.common.OrderStatus.valueOf(status));
        return ApiResponse.ok("Status updated", Map.of("orderId", orderId, "status", status));
    }

    @PatchMapping("/{orderId}/delivery-details")
    public ApiResponse<OrderEntity> updateDeliveryDetails(
            @PathVariable String orderId,
            @RequestBody Map<String, String> details) {
        OrderEntity order = repo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (details.containsKey("receiverName")) order.setReceiverName(details.get("receiverName"));
        if (details.containsKey("phoneNumber")) order.setPhoneNumber(details.get("phoneNumber"));
        if (details.containsKey("address")) order.setAddress(details.get("address"));
        if (details.containsKey("deliveryInstructions")) order.setDeliveryInstructions(details.get("deliveryInstructions"));
        return ApiResponse.ok("Delivery details updated", repo.save(order));
    }
}
