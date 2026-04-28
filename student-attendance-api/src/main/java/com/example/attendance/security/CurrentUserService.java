package com.example.attendance.security;

import com.example.attendance.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    public Optional<User> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();
        Object principal = auth.getPrincipal();
        if (principal instanceof UserPrincipal up) {
            return Optional.of(up.user());
        }
        return Optional.empty();
    }

    public User requireUser() {
        return currentUser()
                .orElseThrow(() -> new AccessDeniedException("Authentication required"));
    }
}
