package com.payvault.dto.request;

import com.payvault.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProcessPaymentRequest {
    @NotBlank private String orderReference;
    @NotNull private PaymentMethod paymentMethod;
    private String cardNumber;
    private String cardHolderName;
    private String expiryMonth;
    private String expiryYear;
    private String cvv;
    private String upiId;
}
