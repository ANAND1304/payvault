package com.payvault.service.impl;

import com.payvault.dto.response.TransactionResponse;
import com.payvault.entity.Transaction;
import com.payvault.entity.User;
import com.payvault.exception.ResourceNotFoundException;
import com.payvault.repository.TransactionRepository;
import com.payvault.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionService(TransactionRepository transactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getMerchantTransactions(String merchantEmail, Pageable pageable) {
        User merchant = userRepository.findByEmail(merchantEmail)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", merchantEmail));

        return transactionRepository.findByMerchant(merchant, pageable)
            .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(UUID id) {
        Transaction t = transactionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", id));
        return toResponse(t);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getByReference(String reference) {
        Transaction t = transactionRepository.findByTransactionReference(reference)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", "reference", reference));
        return toResponse(t);
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
            .id(t.getId())
            .transactionReference(t.getTransactionReference())
            .orderReference(t.getOrder() != null ? t.getOrder().getOrderReference() : null)
            .amount(t.getAmount())
            .currency(t.getCurrency())
            .status(t.getStatus())
            .paymentMethod(t.getPaymentMethod())
            .cardLastFour(t.getCardLastFour())
            .cardBrand(t.getCardBrand())
            .failureReason(t.getFailureReason())
            .retryCount(t.getRetryCount())
            .processedAt(t.getProcessedAt())
            .createdAt(t.getCreatedAt())
            .merchantName(t.getOrder() != null && t.getOrder().getMerchant() != null
                ? t.getOrder().getMerchant().getBusinessName() : null)
            .description(t.getOrder() != null ? t.getOrder().getDescription() : null)
            .build();
    }
}
