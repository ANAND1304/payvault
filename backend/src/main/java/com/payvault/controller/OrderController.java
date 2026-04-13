package com.payvault.controller;

import com.payvault.dto.request.CreateOrderRequest;
import com.payvault.dto.response.ApiResponse;
import com.payvault.dto.response.DashboardStatsResponse;
import com.payvault.dto.response.OrderResponse;
import com.payvault.service.impl.PaymentOrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final PaymentOrderService orderService;
    public OrderController(PaymentOrderService orderService) { this.orderService = orderService; }

    @PostMapping
    @PreAuthorize("hasRole('MERCHANT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody CreateOrderRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Order created", orderService.createOrder(request, auth.getName())));
    }

    @GetMapping
    @PreAuthorize("hasRole('MERCHANT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrders(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getMerchantOrders(auth.getName(), PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{reference}")
    @PreAuthorize("hasRole('MERCHANT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable String reference) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderByReference(reference)));
    }

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasRole('MERCHANT') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getDashboardStats(auth.getName())));
    }
}
