package com.payvault.dto.response;

import com.payvault.entity.enums.OrderStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder
public class OrderResponse {
    private UUID id;
    private String orderReference;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String customerEmail;
    private String customerName;
    private String customerPhone;
    private OrderStatus status;
    private String paymentLink;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
