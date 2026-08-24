package com.healthcare.appointment.exception;

public class DoctorOnLeaveException extends RuntimeException {
    public DoctorOnLeaveException(String message) { super(message); }
    public DoctorOnLeaveException() {
        super("The doctor is on leave for the selected date. Please choose a different date.");
    }
}
