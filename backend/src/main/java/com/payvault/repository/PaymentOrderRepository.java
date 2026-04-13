package com.payvault.repository;

import com.payvault.entity.PaymentOrder;
import com.payvault.entity.User;
import com.payvault.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, UUID> {
    Optional<PaymentOrder> findByOrderReference(String orderReference);
    Page<PaymentOrder> findByMerchant(User merchant, Pageable pageable);
    List<PaymentOrder> findByMerchantAndStatus(User merchant, OrderStatus status);
    long countByMerchantAndStatus(User merchant, OrderStatus status);

    @Query("SELECT COUNT(o) FROM PaymentOrder o WHERE o.merchant = :merchant AND o.createdAt >= :since")
    long countByMerchantSince(@Param("merchant") User merchant, @Param("since") LocalDateTime since);
}
