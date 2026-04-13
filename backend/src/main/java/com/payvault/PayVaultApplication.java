package com.payvault;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class PayVaultApplication {
    public static void main(String[] args) {
        SpringApplication.run(PayVaultApplication.class, args);
    }
}
