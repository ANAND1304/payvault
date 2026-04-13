package com.payvault.controller;

import com.payvault.dto.response.ApiResponse;
import com.payvault.dto.response.TransactionResponse;
import com.payvault.dto.response.UserProfileResponse;
import com.payvault.service.impl.UserProfileService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * User-facing endpoints. Accessible by USER, MERCHANT, and ADMIN roles.
 * A MERCHANT can also use these to see their own profile — same data, different consumer.
 */
@RestController
@RequestMapping("/api/v1/user")
@PreAuthorize("hasAnyRole('USER', 'MERCHANT', 'ADMIN')")
public class UserController {

    private final UserProfileService userProfileService;

    public UserController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getProfile(auth.getName())));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getMyTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {
        Page<TransactionResponse> txns = userProfileService.getMyTransactions(
            auth.getName(), PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.ok(txns));
    }
}
