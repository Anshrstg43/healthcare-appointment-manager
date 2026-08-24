package com.healthcare.appointment.controller;

import com.healthcare.appointment.dto.DoctorDto;
import com.healthcare.appointment.dto.PageResponse;
import com.healthcare.appointment.dto.TimeSlotDto;
import com.healthcare.appointment.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors Public API", description = "Public search and availability slots for doctors")
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    @Operation(summary = "Search and filter doctors by specialization and name")
    public ResponseEntity<PageResponse<DoctorDto>> searchDoctors(
        @RequestParam(required = false) String specialization,
        @RequestParam(required = false) String name,
        @PageableDefault(size = 12, sort = "user.name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(PageResponse.from(doctorService.searchDoctors(specialization, name, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get doctor details by ID")
    public ResponseEntity<DoctorDto> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Calculate available time slots for a doctor on a specific date")
    public ResponseEntity<List<TimeSlotDto>> getAvailability(
        @PathVariable Long id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(doctorService.getDoctorAvailability(id, date));
    }

    @GetMapping("/specializations")
    @Operation(summary = "Get list of all active doctor specializations")
    public ResponseEntity<List<String>> getSpecializations() {
        return ResponseEntity.ok(doctorService.getSpecializations());
    }
}
