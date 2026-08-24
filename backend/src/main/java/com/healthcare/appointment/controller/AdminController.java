package com.healthcare.appointment.controller;

import com.healthcare.appointment.dto.*;
import com.healthcare.appointment.entity.AppointmentStatus;
import com.healthcare.appointment.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Portal API", description = "Endpoints for administrators to manage doctors, leaves, users, and oversee appointments")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    @Operation(summary = "Get overall administrative statistics and metrics")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getAdminStats());
    }

    @GetMapping("/users")
    @Operation(summary = "List all registered users with pagination")
    public ResponseEntity<PageResponse<UserDto>> listUsers(
        @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(PageResponse.from(adminService.listUsers(pageable)));
    }

    @GetMapping("/doctors")
    @Operation(summary = "List all doctors with configuration details")
    public ResponseEntity<PageResponse<DoctorDto>> listDoctors(
        @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(PageResponse.from(adminService.listDoctors(pageable)));
    }

    @PostMapping("/doctors")
    @Operation(summary = "Create a new doctor profile and user account")
    public ResponseEntity<DoctorDto> createDoctor(@Valid @RequestBody DoctorCreateRequest request) {
        DoctorDto doctor = adminService.createDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(doctor);
    }

    @PutMapping("/doctors/{id}")
    @Operation(summary = "Update doctor specialization, hours, slot duration, or status")
    public ResponseEntity<DoctorDto> updateDoctor(
        @PathVariable Long id,
        @Valid @RequestBody DoctorUpdateRequest request
    ) {
        return ResponseEntity.ok(adminService.updateDoctor(id, request));
    }

    @GetMapping("/doctors/{id}/leave")
    @Operation(summary = "Get leave schedule for a specific doctor")
    public ResponseEntity<List<DoctorLeaveDto>> getDoctorLeaves(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getDoctorLeaves(id));
    }

    @PostMapping("/doctors/{id}/leave")
    @Operation(summary = "Schedule doctor leave date (cancels conflicting appointments and notifies patients)")
    public ResponseEntity<DoctorLeaveDto> addDoctorLeave(
        @PathVariable Long id,
        @Valid @RequestBody DoctorLeaveRequest request
    ) {
        DoctorLeaveDto leave = adminService.addDoctorLeave(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(leave);
    }

    @DeleteMapping("/leave/{leaveId}")
    @Operation(summary = "Remove scheduled doctor leave")
    public ResponseEntity<Map<String, String>> deleteLeave(@PathVariable Long leaveId) {
        adminService.deleteDoctorLeave(leaveId);
        return ResponseEntity.ok(Map.of("message", "Leave date removed successfully"));
    }

    @GetMapping("/appointments")
    @Operation(summary = "List all appointments across all doctors with filtering")
    public ResponseEntity<PageResponse<AppointmentDto>> listAppointments(
        @RequestParam(required = false) AppointmentStatus status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @PageableDefault(size = 15, sort = "appointmentDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(PageResponse.from(adminService.listAppointments(status, date, pageable)));
    }
}
