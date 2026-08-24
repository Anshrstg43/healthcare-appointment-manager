package com.healthcare.appointment.service;

import com.healthcare.appointment.dto.*;
import com.healthcare.appointment.entity.Patient;
import com.healthcare.appointment.entity.Role;
import com.healthcare.appointment.entity.User;
import com.healthcare.appointment.exception.ResourceNotFoundException;
import com.healthcare.appointment.mapper.EntityMapper;
import com.healthcare.appointment.repository.PatientRepository;
import com.healthcare.appointment.repository.UserRepository;
import com.healthcare.appointment.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final EntityMapper entityMapper;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + req.getEmail());
        }

        User user = User.builder()
            .name(req.getName())
            .email(req.getEmail().toLowerCase().trim())
            .passwordHash(passwordEncoder.encode(req.getPassword()))
            .phone(req.getPhone())
            .role(Role.PATIENT)
            .active(true)
            .build();

        user = userRepository.save(user);

        Patient patient = Patient.builder()
            .user(user)
            .build();
        patientRepository.save(patient);

        log.info("Patient registered successfully: userId={}, email={}", user.getId(), user.getEmail());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtExpirationMs / 1000)
            .user(entityMapper.toUserDto(user))
            .build();
    }

    public AuthResponse login(LoginRequest req) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail().toLowerCase().trim(), req.getPassword())
            );
        } catch (Exception e) {
            log.warn("Login failed for email {}: {}", req.getEmail(), e.getMessage());
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        log.info("User logged in successfully: userId={}, role={}", user.getId(), user.getRole());

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtExpirationMs / 1000)
            .user(entityMapper.toUserDto(user))
            .build();
    }

    public AuthResponse refresh(RefreshTokenRequest req) {
        if (!jwtTokenProvider.validateToken(req.getRefreshToken())) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        String email = jwtTokenProvider.extractUsername(req.getRefreshToken());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String newAccessToken = jwtTokenProvider.generateToken(userDetails);

        return AuthResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(req.getRefreshToken())
            .tokenType("Bearer")
            .expiresIn(jwtExpirationMs / 1000)
            .user(entityMapper.toUserDto(user))
            .build();
    }
}
