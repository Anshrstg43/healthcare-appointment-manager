package com.healthcare.appointment.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return buildError(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(SlotUnavailableException.class)
    public ResponseEntity<ApiError> handleSlotUnavailable(SlotUnavailableException ex) {
        log.warn("Slot conflict: {}", ex.getMessage());
        return buildError(HttpStatus.CONFLICT, "SLOT_UNAVAILABLE", ex.getMessage());
    }

    @ExceptionHandler(DoctorOnLeaveException.class)
    public ResponseEntity<ApiError> handleDoctorOnLeave(DoctorOnLeaveException ex) {
        return buildError(HttpStatus.CONFLICT, "DOCTOR_ON_LEAVE", ex.getMessage());
    }

    @ExceptionHandler(AppointmentStateException.class)
    public ResponseEntity<ApiError> handleAppointmentState(AppointmentStateException ex) {
        return buildError(HttpStatus.BAD_REQUEST, "INVALID_APPOINTMENT_STATE", ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Authentication failure: bad credentials");
        return buildError(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex) {
        return buildError(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not have permission to access this resource.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError err : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(err.getField(), err.getDefaultMessage());
        }
        ApiError error = ApiError.builder()
            .timestamp(Instant.now())
            .status(HttpStatus.BAD_REQUEST.value())
            .error("VALIDATION_FAILED")
            .message("Request validation failed.")
            .fieldErrors(fieldErrors)
            .build();
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneral(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
            "An unexpected error occurred. Please try again later.");
    }

    private ResponseEntity<ApiError> buildError(HttpStatus status, String error, String message) {
        ApiError apiError = ApiError.builder()
            .timestamp(Instant.now())
            .status(status.value())
            .error(error)
            .message(message)
            .build();
        return ResponseEntity.status(status).body(apiError);
    }
}
