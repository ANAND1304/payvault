package com.payvault.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateOrderRequest {
    @NotNull @DecimalMin("1.00") private BigDecimal amount;
    @NotBlank @Size(max=3) private String currency;
    @Size(max=500) private String description;
    @Email private String customerEmail;
    private String customerName;
    private String customerPhone;
}
