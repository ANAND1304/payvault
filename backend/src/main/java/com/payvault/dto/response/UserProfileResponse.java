package com.payvault.dto.response;

import com.payvault.entity.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserProfileResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String businessName;
    private String phone;
    private UserRole role;
    private LocalDateTime memberSince;
}
