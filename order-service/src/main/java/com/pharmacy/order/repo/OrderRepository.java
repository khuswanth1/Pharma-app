package com.pharmacy.order.repo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.pharmacy.order.entity.OrderEntity;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
    List<OrderEntity> findByUserIdOrderByCreatedAtDesc(String userId);
}
