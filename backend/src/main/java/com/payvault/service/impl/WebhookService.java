package com.payvault.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payvault.entity.PaymentOrder;
import com.payvault.entity.Transaction;
import com.payvault.entity.WebhookEvent;
import com.payvault.entity.enums.WebhookStatus;
import com.payvault.repository.WebhookEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);

    private final WebhookEventRepository webhookEventRepository;
    private final ObjectMapper objectMapper;

    public WebhookService(WebhookEventRepository webhookEventRepository, ObjectMapper objectMapper) {
        this.webhookEventRepository = webhookEventRepository;
        this.objectMapper = objectMapper;
    }

    @Async
    public void dispatchWebhook(Transaction transaction, PaymentOrder order) {
        String eventType = "payment." + transaction.getStatus().name().toLowerCase();

        Map<String, Object> payload = new HashMap<>();
        payload.put("event", eventType);
        payload.put("transactionReference", transaction.getTransactionReference());
        payload.put("orderReference", order.getOrderReference());
        payload.put("amount", transaction.getAmount());
        payload.put("currency", transaction.getCurrency());
        payload.put("status", transaction.getStatus().name());
        payload.put("paymentMethod", transaction.getPaymentMethod());
        payload.put("timestamp", LocalDateTime.now().toString());

        if (transaction.getFailureReason() != null) {
            payload.put("failureReason", transaction.getFailureReason());
        }

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            payloadJson = "{\"error\":\"serialization_failed\"}";
        }

        WebhookEvent event = WebhookEvent.builder()
            .eventType(eventType)
            .transactionReference(transaction.getTransactionReference())
            .orderReference(order.getOrderReference())
            .payload(payloadJson)
            .build();

        // Simulate delivery
        try {
            Thread.sleep(500); // Simulate HTTP call
            event.setStatus(WebhookStatus.DELIVERED);
            event.setResponseCode(200);
            event.setResponseBody("{\"received\":true}");
            event.setAttemptCount(1);
            event.setLastAttemptAt(LocalDateTime.now());
            log.info("Webhook delivered: {} for {}", eventType, order.getOrderReference());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            event.setStatus(WebhookStatus.FAILED);
            event.setAttemptCount(1);
        }

        webhookEventRepository.save(event);
    }
}
