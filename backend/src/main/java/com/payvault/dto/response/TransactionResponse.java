package com.payvault.dto.response;

import com.payvault.entity.enums.PaymentMethod;
import com.payvault.entity.enums.TransactionStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder
public class TransactionResponse {
    private UUID id;
    private String transactionReference;
    private String orderReference;
    private BigDecimal amount;
    private String currency;
    private TransactionStatus status;
    private PaymentMethod paymentMethod;
    private String cardLastFour;
    private String cardBrand;
    private String failureReason;
    private Integer retryCount;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
    private String merchantName;
    private String description;
}
