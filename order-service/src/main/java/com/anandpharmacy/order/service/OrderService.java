package com.anandpharmacy.order.service;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.anandpharmacy.common.OrderStatus;
import com.anandpharmacy.order.entity.OrderEntity;
import com.anandpharmacy.order.repo.OrderRepository;

@Service
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private final OrderRepository orderRepo;

    public OrderService(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    @Transactional
    public OrderEntity createOrder(OrderEntity order) {
        order.setStatus(OrderStatus.CREATED);
        OrderEntity saved = orderRepo.save(order);
        log.info("Order Created | orderId={} status={}", saved.getId(), saved.getStatus());
        return saved;
    }

    @Transactional
    public OrderEntity updateStatus(String orderId, OrderStatus status) {
        OrderEntity order = orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        order.setStatus(status);
        OrderEntity saved = orderRepo.save(order);
        log.info("Order Status Updated | orderId={} status={}", saved.getId(), saved.getStatus());
        return saved;
    }
}
