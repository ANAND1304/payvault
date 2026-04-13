package com.payvault.service.impl;

import com.payvault.dto.response.TransactionResponse;
import com.payvault.dto.response.UserProfileResponse;
import com.payvault.entity.Transaction;
import com.payvault.entity.User;
import com.payvault.entity.enums.UserRole;
import com.payvault.exception.ResourceNotFoundException;
import com.payvault.repository.TransactionRepository;
import com.payvault.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public UserProfileService(UserRepository userRepository, TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return UserProfileResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .businessName(user.getBusinessName())
            .phone(user.getPhone())
            .role(user.getRole())
            .memberSince(user.getCreatedAt())
            .build();
    }

    /**
     * For a USER: returns transactions where the order's customer email matches their account email.
     * For a MERCHANT acting as user: falls through to the same logic — lets them see both views.
     */
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getMyTransactions(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // MERCHANTs have a dedicated merchant transactions endpoint; here we serve
        // transactions tied to orders where this user was the payer (customer email match).
        if (user.getRole() == UserRole.MERCHANT || user.getRole() == UserRole.ADMIN) {
            // Merchants calling /user/transactions see transactions as a payer, not as a merchant.
            // Return their merchant-side transactions from findByMerchant for convenience.
            return transactionRepository.findByMerchant(user, pageable)
                .map(t -> toResponse(t));
        }

        // For plain USERs: look up transactions where order's customer email is theirs.
        return transactionRepository.findByCustomerEmail(email, pageable)
            .map(t -> toResponse(t));
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
