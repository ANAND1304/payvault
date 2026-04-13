package com.payvault.repository;

import com.payvault.entity.WebhookEvent;
import com.payvault.entity.enums.WebhookStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WebhookEventRepository extends JpaRepository<WebhookEvent, UUID> {
    List<WebhookEvent> findByStatus(WebhookStatus status);
    List<WebhookEvent> findByOrderReference(String orderReference);
}
