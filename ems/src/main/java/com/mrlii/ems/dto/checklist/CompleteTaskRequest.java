package com.mrlii.ems.dto.checklist;

// Submitted when an owner marks a checklist task as done (US-603, US-604)
public record CompleteTaskRequest(

        String notes

) {}
