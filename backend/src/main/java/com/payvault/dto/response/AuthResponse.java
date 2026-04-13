package com.payvault.dto.response;

import com.payvault.entity.enums.UserRole;
import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data @Builder
public class AuthResponse {
    private String token;
    private String tokenType;
    private UUID userId;
    private String email;
    private String fullName;
    private String businessName;
    private UserRole role;
    private String apiKey;
}
