package com.payvault.repository;

import com.payvault.entity.PaymentOrder;
import com.payvault.entity.Transaction;
import com.payvault.entity.User;
import com.payvault.entity.enums.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByTransactionReference(String transactionReference);
    List<Transaction> findByOrder(PaymentOrder order);
    List<Transaction> findByOrderAndStatus(PaymentOrder order, TransactionStatus status);

    @Query("SELECT t FROM Transaction t JOIN t.order o WHERE o.merchant = :merchant ORDER BY t.createdAt DESC")
    Page<Transaction> findByMerchant(@Param("merchant") User merchant, Pageable pageable);

    @Query("SELECT COUNT(t) FROM Transaction t JOIN t.order o WHERE o.merchant = :merchant AND t.status = :status")
    long countByMerchantAndStatus(@Param("merchant") User merchant, @Param("status") TransactionStatus status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t JOIN t.order o WHERE o.merchant = :merchant AND t.status = 'SUCCESS'")
    BigDecimal sumSuccessfulAmountByMerchant(@Param("merchant") User merchant);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t JOIN t.order o WHERE o.merchant = :merchant AND t.status = 'SUCCESS' AND t.createdAt >= :since")
    BigDecimal sumSuccessfulAmountByMerchantSince(@Param("merchant") User merchant, @Param("since") LocalDateTime since);

    /**
     * Finds transactions where the payer's email (stored on the order) matches.
     * Used for the USER role's payment history view.
     */
    @Query("SELECT t FROM Transaction t JOIN t.order o WHERE o.customerEmail = :email ORDER BY t.createdAt DESC")
    Page<Transaction> findByCustomerEmail(@Param("email") String email, Pageable pageable);
}
