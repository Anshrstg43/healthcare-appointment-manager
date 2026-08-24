package com.healthcare.appointment.dto;

import com.healthcare.appointment.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private boolean active;
    private Instant createdAt;
}
