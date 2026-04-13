package com.payvault.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class ReferenceGenerator {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyMMdd");

    public String generateOrderReference() {
        String datePart = LocalDateTime.now().format(DATE_FORMAT);
        String randomPart = generateRandomString(8);
        return "ORD-" + datePart + "-" + randomPart;
    }

    public String generateTransactionReference() {
        String datePart = LocalDateTime.now().format(DATE_FORMAT);
        String randomPart = generateRandomString(12);
        return "TXN-" + datePart + "-" + randomPart;
    }

    public String generateApiKey() {
        return "pvt_" + generateRandomString(32).toLowerCase();
    }

    public String generatePaymentLinkToken() {
        return generateRandomString(24).toLowerCase();
    }

    private String generateRandomString(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }
}
