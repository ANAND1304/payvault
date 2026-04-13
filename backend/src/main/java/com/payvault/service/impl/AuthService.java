package com.payvault.service.impl;

import com.payvault.dto.request.LoginRequest;
import com.payvault.dto.request.RegisterRequest;
import com.payvault.dto.response.AuthResponse;
import com.payvault.entity.User;
import com.payvault.entity.enums.UserRole;
import com.payvault.exception.BusinessException;
import com.payvault.repository.UserRepository;
import com.payvault.util.JwtUtil;
import com.payvault.util.ReferenceGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final ReferenceGenerator referenceGenerator;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil, AuthenticationManager authenticationManager,
                       ReferenceGenerator referenceGenerator) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.referenceGenerator = referenceGenerator;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email is already registered", "EMAIL_EXISTS");
        }

        // Prevent admin self-registration
        if (request.getRole() == UserRole.ADMIN) {
            throw new BusinessException("Admin accounts cannot be self-registered", "INVALID_ROLE");
        }

        String apiKey = null;
        if (request.getRole() == UserRole.MERCHANT) {
            apiKey = referenceGenerator.generateApiKey();
        }

        User user = User.builder()
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .businessName(request.getBusinessName())
            .phone(request.getPhone())
            .role(request.getRole())
            .apiKey(apiKey)
            .build();

        User saved = userRepository.save(user);
        log.info("New {} registered: {}", saved.getRole(), saved.getEmail());

        String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole().name(), saved.getId());

        return AuthResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .userId(saved.getId())
            .email(saved.getEmail())
            .fullName(saved.getFullName())
            .businessName(saved.getBusinessName())
            .role(saved.getRole())
            .apiKey(saved.getApiKey())
            .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BusinessException("User not found", "USER_NOT_FOUND"));

        if (!user.getIsActive()) {
            throw new BusinessException("Account is deactivated. Contact support.", "ACCOUNT_DEACTIVATED");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .userId(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .businessName(user.getBusinessName())
            .role(user.getRole())
            .apiKey(user.getApiKey())
            .build();
    }
}
