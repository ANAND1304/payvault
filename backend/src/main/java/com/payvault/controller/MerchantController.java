package com.payvault.controller;

import com.payvault.dto.request.CreateOrderRequest;
import com.payvault.dto.response.ApiResponse;
import com.payvault.dto.response.DashboardStatsResponse;
import com.payvault.dto.response.OrderResponse;
import com.payvault.dto.response.TransactionResponse;
import com.payvault.service.impl.PaymentOrderService;
import com.payvault.service.impl.TransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * All merchant-facing endpoints. Access restricted to MERCHANT and ADMIN roles.
 * USERs receive 403 at the URL-level before even reaching this controller.
 */
@RestController
@RequestMapping("/api/v1/merchant")
@PreAuthorize("hasAnyRole('MERCHANT', 'ADMIN')")
public class MerchantController {

    private final PaymentOrderService orderService;
    private final TransactionService transactionService;

    public MerchantController(PaymentOrderService orderService, TransactionService transactionService) {
        this.orderService = orderService;
        this.transactionService = transactionService;
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getDashboardStats(auth.getName())));
    }

    // ── Orders ───────────────────────────────────────────────────────────────

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request, Authentication auth) {
        OrderResponse order = orderService.createOrder(request, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Order created", order));
    }

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> listOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        Page<OrderResponse> orders = orderService.getMerchantOrders(
            auth.getName(), PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @GetMapping("/orders/{reference}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable String reference) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderByReference(reference)));
    }

    // ── Transactions ─────────────────────────────────────────────────────────

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> listTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        Page<TransactionResponse> txns = transactionService.getMerchantTransactions(
            auth.getName(), PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.ok(txns));
    }
}
