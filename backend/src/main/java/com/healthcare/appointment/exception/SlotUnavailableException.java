package com.healthcare.appointment.exception;

public class SlotUnavailableException extends RuntimeException {
    public SlotUnavailableException(String message) { super(message); }
    public SlotUnavailableException() {
        super("The selected appointment slot is no longer available. Please choose a different time.");
    }
}
