package com.payvault.service.impl;

import com.payvault.dto.request.CreateOrderRequest;
import com.payvault.dto.response.DashboardStatsResponse;
import com.payvault.dto.response.OrderResponse;
import com.payvault.entity.PaymentOrder;
import com.payvault.entity.User;
import com.payvault.entity.enums.OrderStatus;
import com.payvault.entity.enums.TransactionStatus;
import com.payvault.exception.BusinessException;
import com.payvault.exception.ResourceNotFoundException;
import com.payvault.repository.PaymentOrderRepository;
import com.payvault.repository.TransactionRepository;
import com.payvault.repository.UserRepository;
import com.payvault.util.ReferenceGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class PaymentOrderService {

    private static final Logger log = LoggerFactory.getLogger(PaymentOrderService.class);

    @Value("${server.port:8080}")
    private String serverPort;

    private final PaymentOrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final ReferenceGenerator referenceGenerator;

    public PaymentOrderService(PaymentOrderRepository orderRepository,
                               TransactionRepository transactionRepository,
                               UserRepository userRepository,
                               ReferenceGenerator referenceGenerator) {
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.referenceGenerator = referenceGenerator;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, String merchantEmail) {
        User merchant = userRepository.findByEmail(merchantEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Merchant", "email", merchantEmail));

        String orderRef = referenceGenerator.generateOrderReference();
        String linkToken = referenceGenerator.generatePaymentLinkToken();
        String paymentLink = "http://localhost:5173/pay/" + linkToken;

        PaymentOrder order = PaymentOrder.builder()
            .orderReference(orderRef)
            .merchant(merchant)
            .amount(request.getAmount())
            .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
            .description(request.getDescription())
            .customerEmail(request.getCustomerEmail())
            .customerName(request.getCustomerName())
            .customerPhone(request.getCustomerPhone())
            .paymentLink(paymentLink)
            .expiresAt(LocalDateTime.now().plusHours(24))
            .build();

        PaymentOrder saved = orderRepository.save(order);
        log.info("Order created: {} for merchant: {}", saved.getOrderReference(), merchantEmail);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getMerchantOrders(String merchantEmail, Pageable pageable) {
        User merchant = userRepository.findByEmail(merchantEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Merchant", "email", merchantEmail));
        return orderRepository.findByMerchant(merchant, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByReference(String reference) {
        PaymentOrder order = orderRepository.findByOrderReference(reference)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "reference", reference));
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByLinkToken(String token) {
        String paymentLink = "http://localhost:5173/pay/" + token;
        return orderRepository.findAll().stream()
            .filter(o -> paymentLink.equals(o.getPaymentLink()))
            .filter(o -> o.getStatus() == OrderStatus.CREATED || o.getStatus() == OrderStatus.PROCESSING)
            .filter(o -> o.getExpiresAt().isAfter(LocalDateTime.now()))
            .findFirst()
            .map(this::toResponse)
            .orElseThrow(() -> new BusinessException("Payment link is invalid or expired", "INVALID_LINK"));
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String merchantEmail) {
        User merchant = userRepository.findByEmail(merchantEmail)
            .orElseThrow(() -> new ResourceNotFoundException("Merchant", "email", merchantEmail));

        long totalOrders = orderRepository.countByMerchantAndStatus(merchant, OrderStatus.PAID)
            + orderRepository.countByMerchantAndStatus(merchant, OrderStatus.FAILED)
            + orderRepository.countByMerchantAndStatus(merchant, OrderStatus.CREATED)
            + orderRepository.countByMerchantAndStatus(merchant, OrderStatus.PROCESSING);

        long successful = transactionRepository.countByMerchantAndStatus(merchant, TransactionStatus.SUCCESS);
        long failed = transactionRepository.countByMerchantAndStatus(merchant, TransactionStatus.FAILED);
        long pending = transactionRepository.countByMerchantAndStatus(merchant, TransactionStatus.PENDING)
            + transactionRepository.countByMerchantAndStatus(merchant, TransactionStatus.PROCESSING);

        BigDecimal totalRevenue = transactionRepository.sumSuccessfulAmountByMerchant(merchant);
        BigDecimal revenueThisMonth = transactionRepository.sumSuccessfulAmountByMerchantSince(
            merchant, LocalDateTime.now().withDayOfMonth(1).withHour(0)
        );

        long ordersToday = orderRepository.countByMerchantSince(
            merchant, LocalDateTime.now().withHour(0).withMinute(0)
        );

        long total = successful + failed;
        double successRate = total > 0 ? (double) successful / total * 100 : 0;

        return DashboardStatsResponse.builder()
            .totalOrders(totalOrders)
            .successfulTransactions(successful)
            .failedTransactions(failed)
            .pendingTransactions(pending)
            .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
            .revenueThisMonth(revenueThisMonth != null ? revenueThisMonth : BigDecimal.ZERO)
            .ordersToday(ordersToday)
            .successRate(Math.round(successRate * 100.0) / 100.0)
            .build();
    }

    private OrderResponse toResponse(PaymentOrder order) {
        return OrderResponse.builder()
            .id(order.getId())
            .orderReference(order.getOrderReference())
            .amount(order.getAmount())
            .currency(order.getCurrency())
            .description(order.getDescription())
            .customerEmail(order.getCustomerEmail())
            .customerName(order.getCustomerName())
            .customerPhone(order.getCustomerPhone())
            .status(order.getStatus())
            .paymentLink(order.getPaymentLink())
            .expiresAt(order.getExpiresAt())
            .createdAt(order.getCreatedAt())
            .build();
    }
}
