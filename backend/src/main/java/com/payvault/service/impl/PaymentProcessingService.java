package com.payvault.service.impl;

import com.payvault.dto.request.ProcessPaymentRequest;
import com.payvault.dto.response.TransactionResponse;
import com.payvault.entity.PaymentOrder;
import com.payvault.entity.Transaction;
import com.payvault.entity.enums.OrderStatus;
import com.payvault.entity.enums.PaymentMethod;
import com.payvault.entity.enums.TransactionStatus;
import com.payvault.exception.BusinessException;
import com.payvault.exception.ResourceNotFoundException;
import com.payvault.repository.PaymentOrderRepository;
import com.payvault.repository.TransactionRepository;
import com.payvault.util.ReferenceGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
public class PaymentProcessingService {

    private static final Logger log = LoggerFactory.getLogger(PaymentProcessingService.class);

    @Value("${payvault.payment.success-rate:0.85}")
    private double successRate;

    @Value("${payvault.payment.processing-delay-ms:2000}")
    private long processingDelayMs;

    private final PaymentOrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final ReferenceGenerator referenceGenerator;
    private final WebhookService webhookService;
    private final Random random = new Random();

    public PaymentProcessingService(PaymentOrderRepository orderRepository,
                                    TransactionRepository transactionRepository,
                                    ReferenceGenerator referenceGenerator,
                                    WebhookService webhookService) {
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.referenceGenerator = referenceGenerator;
        this.webhookService = webhookService;
    }

    @Transactional
    public TransactionResponse processPayment(ProcessPaymentRequest request) {
        PaymentOrder order = orderRepository.findByOrderReference(request.getOrderReference())
            .orElseThrow(() -> new ResourceNotFoundException("Order", "reference", request.getOrderReference()));

        validateOrderForPayment(order);

        // Update order to PROCESSING
        order.setStatus(OrderStatus.PROCESSING);
        orderRepository.save(order);

        // Create PENDING transaction
        Transaction transaction = Transaction.builder()
            .transactionReference(referenceGenerator.generateTransactionReference())
            .order(order)
            .amount(order.getAmount())
            .currency(order.getCurrency())
            .status(TransactionStatus.PROCESSING)
            .paymentMethod(request.getPaymentMethod())
            .cardLastFour(extractLastFour(request))
            .cardBrand(detectCardBrand(request.getCardNumber()))
            .build();

        transactionRepository.save(transaction);

        // Simulate processing delay
        simulateProcessingDelay();

        // Determine outcome
        boolean isSuccess = simulatePaymentGateway(request);

        if (isSuccess) {
            transaction.setStatus(TransactionStatus.SUCCESS);
            transaction.setGatewayResponse("{\"code\":\"00\",\"message\":\"Approved\"}");
            transaction.setProcessedAt(LocalDateTime.now());
            order.setStatus(OrderStatus.PAID);
            log.info("Payment SUCCESS for order: {}", order.getOrderReference());
        } else {
            String failureReason = pickFailureReason();
            transaction.setStatus(TransactionStatus.FAILED);
            transaction.setFailureReason(failureReason);
            transaction.setGatewayResponse("{\"code\":\"51\",\"message\":\"" + failureReason + "\"}");
            transaction.setProcessedAt(LocalDateTime.now());
            order.setStatus(OrderStatus.FAILED);
            log.warn("Payment FAILED for order: {} - {}", order.getOrderReference(), failureReason);
        }

        transactionRepository.save(transaction);
        orderRepository.save(order);

        // Dispatch webhook async
        webhookService.dispatchWebhook(transaction, order);

        return toResponse(transaction, order);
    }

    @Transactional
    public TransactionResponse retryPayment(UUID transactionId, ProcessPaymentRequest request) {
        Transaction original = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        if (original.getStatus() != TransactionStatus.FAILED) {
            throw new BusinessException("Only FAILED transactions can be retried", "INVALID_RETRY");
        }

        if (original.getRetryCount() >= 3) {
            throw new BusinessException("Maximum retry attempts (3) reached", "MAX_RETRIES_EXCEEDED");
        }

        PaymentOrder order = original.getOrder();
        order.setStatus(OrderStatus.PROCESSING);
        orderRepository.save(order);

        Transaction retry = Transaction.builder()
            .transactionReference(referenceGenerator.generateTransactionReference())
            .order(order)
            .amount(order.getAmount())
            .currency(order.getCurrency())
            .status(TransactionStatus.PROCESSING)
            .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : original.getPaymentMethod())
            .cardLastFour(extractLastFour(request) != null ? extractLastFour(request) : original.getCardLastFour())
            .cardBrand(original.getCardBrand())
            .retryCount(original.getRetryCount() + 1)
            .parentTransactionId(original.getId())
            .build();

        transactionRepository.save(retry);
        simulateProcessingDelay();

        boolean isSuccess = simulatePaymentGateway(request);

        if (isSuccess) {
            retry.setStatus(TransactionStatus.SUCCESS);
            retry.setProcessedAt(LocalDateTime.now());
            order.setStatus(OrderStatus.PAID);
        } else {
            retry.setStatus(TransactionStatus.FAILED);
            retry.setFailureReason(pickFailureReason());
            retry.setProcessedAt(LocalDateTime.now());
            order.setStatus(OrderStatus.FAILED);
        }

        transactionRepository.save(retry);
        orderRepository.save(order);
        webhookService.dispatchWebhook(retry, order);

        return toResponse(retry, order);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getMerchantTransactions(String merchantEmail, Pageable pageable) {
        var merchant = new com.payvault.entity.User();
        merchant.setEmail(merchantEmail);
        // Load from repo via email
        return transactionRepository.findAll(pageable)
            .map(t -> toResponse(t, t.getOrder()));
    }

    private void validateOrderForPayment(PaymentOrder order) {
        if (order.getStatus() == OrderStatus.PAID) {
            throw new BusinessException("This order has already been paid", "ORDER_ALREADY_PAID");
        }
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.EXPIRED) {
            throw new BusinessException("This order is no longer valid", "ORDER_INVALID");
        }
        if (order.getExpiresAt() != null && order.getExpiresAt().isBefore(LocalDateTime.now())) {
            order.setStatus(OrderStatus.EXPIRED);
            orderRepository.save(order);
            throw new BusinessException("This payment link has expired", "ORDER_EXPIRED");
        }
    }

    private boolean simulatePaymentGateway(ProcessPaymentRequest request) {
        // Simulate specific card numbers for testing
        if (request.getCardNumber() != null) {
            String card = request.getCardNumber().replaceAll("\\s+", "");
            if (card.endsWith("0000")) return false; // Always fail
            if (card.endsWith("1111")) return true;  // Always succeed
        }
        return random.nextDouble() < successRate;
    }

    private void simulateProcessingDelay() {
        try {
            Thread.sleep(processingDelayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private String extractLastFour(ProcessPaymentRequest request) {
        if (request.getCardNumber() == null) return null;
        String cleaned = request.getCardNumber().replaceAll("\\s+", "");
        return cleaned.length() >= 4 ? cleaned.substring(cleaned.length() - 4) : null;
    }

    private String detectCardBrand(String cardNumber) {
        if (cardNumber == null) return "UNKNOWN";
        String cleaned = cardNumber.replaceAll("\\s+", "");
        if (cleaned.startsWith("4")) return "VISA";
        if (cleaned.startsWith("5") || cleaned.startsWith("2")) return "MASTERCARD";
        if (cleaned.startsWith("34") || cleaned.startsWith("37")) return "AMEX";
        if (cleaned.startsWith("6")) return "RUPAY";
        return "UNKNOWN";
    }

    private String pickFailureReason() {
        String[] reasons = {
            "Insufficient funds",
            "Card declined by bank",
            "Invalid card details",
            "Transaction limit exceeded",
            "Suspected fraud - contact your bank",
            "Card expired"
        };
        return reasons[random.nextInt(reasons.length)];
    }

    private TransactionResponse toResponse(Transaction t, PaymentOrder order) {
        return TransactionResponse.builder()
            .id(t.getId())
            .transactionReference(t.getTransactionReference())
            .orderReference(order.getOrderReference())
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
            .merchantName(order.getMerchant() != null ? order.getMerchant().getBusinessName() : null)
            .description(order.getDescription())
            .build();
    }
}
