package com.example.attendance.service;

import com.example.attendance.domain.User;
import com.example.attendance.domain.UserRole;
import com.example.attendance.dto.AuthResponse;
import com.example.attendance.dto.LoginRequest;
import com.example.attendance.dto.RegisterRequest;
import com.example.attendance.dto.UserResponse;
import com.example.attendance.exception.ConflictException;
import com.example.attendance.repository.UserRepository;
import com.example.attendance.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        String username = request.username().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username already taken: " + username);
        }
        User user = User.builder()
                .username(username)
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName().trim())
                .role(UserRole.USER)
                .build();
        user = userRepository.save(user);
        return buildAuth(user);
    }

    public AuthResponse login(LoginRequest request) {
        // Throws BadCredentialsException on bad password (mapped to 401 elsewhere).
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.username().trim().toLowerCase(),
                request.password()
        ));
        User user = userRepository.findByUsername(request.username().trim().toLowerCase())
                .orElseThrow();
        return buildAuth(user);
    }

    @Transactional(readOnly = true)
    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getRole(),
                user.getCreatedAt()
        );
    }

    private AuthResponse buildAuth(User user) {
        String token = jwtService.generate(user);
        return new AuthResponse(
                token,
                "Bearer",
                jwtService.expirationSeconds(),
                toResponse(user)
        );
    }
}
