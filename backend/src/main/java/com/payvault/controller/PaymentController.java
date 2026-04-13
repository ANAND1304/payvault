package com.payvault.controller;

import com.payvault.dto.request.ProcessPaymentRequest;
import com.payvault.dto.response.ApiResponse;
import com.payvault.dto.response.OrderResponse;
import com.payvault.dto.response.TransactionResponse;
import com.payvault.service.impl.PaymentOrderService;
import com.payvault.service.impl.PaymentProcessingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pay")
public class PaymentController {
    private final PaymentProcessingService paymentService;
    private final PaymentOrderService orderService;

    public PaymentController(PaymentProcessingService paymentService, PaymentOrderService orderService) {
        this.paymentService = paymentService;
        this.orderService = orderService;
    }

    @GetMapping("/link/{token}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByToken(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderByLinkToken(token)));
    }

    @PostMapping("/process")
    public ResponseEntity<ApiResponse<TransactionResponse>> processPayment(@RequestBody ProcessPaymentRequest request) {
        TransactionResponse response = paymentService.processPayment(request);
        String msg = "SUCCESS".equals(response.getStatus().name()) ? "Payment successful" : "Payment failed";
        return ResponseEntity.ok(ApiResponse.ok(msg, response));
    }

    @PostMapping("/retry/{transactionId}")
    public ResponseEntity<ApiResponse<TransactionResponse>> retry(@PathVariable UUID transactionId, @RequestBody ProcessPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.retryPayment(transactionId, request)));
    }
}
