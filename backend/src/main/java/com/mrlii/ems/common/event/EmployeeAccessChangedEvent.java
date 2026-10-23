package com.mrlii.ems.common.event;

import com.mrlii.ems.common.enums.CommonStatus;

/**
 * Published after anything that affects what an employee may do changed: status (activate,
 * deactivate, archive, delete) or access-level assignment. {@code status} is the status after the change.
 */
public record EmployeeAccessChangedEvent(Long employeeId, CommonStatus status) {

    /** True when the employee may no longer use the system, so their sessions must end. */
    public boolean revokesAccess() {
        return status == CommonStatus.INACTIVE || status == CommonStatus.ARCHIVED;
    }
}
