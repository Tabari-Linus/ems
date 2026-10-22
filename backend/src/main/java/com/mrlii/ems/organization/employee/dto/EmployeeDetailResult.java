package com.mrlii.ems.organization.employee.dto;

import com.mrlii.ems.accesslevel.dto.AccessLevelListItemResult;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.util.DateTimeUtils;
import com.mrlii.ems.organization.department.dto.DepartmentDetailResult;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.entity.EmployeeAddress;
import com.mrlii.ems.organization.employee.entity.EmployeeIdentification;
import com.mrlii.ems.organization.position.dto.PositionListItemResult;

import java.time.OffsetDateTime;
import java.util.List;

public record EmployeeDetailResult(
        Long id,
        String firstName,
        String lastName,
        String workEmail,
        CommonStatus status,
        PositionListItemResult position,
        DepartmentDetailResult department,
        AccessLevelListItemResult accessLevel,
        EmployeeBioResult bio,
        EmployeeContactResult contact,
        List<EmployeeAddressResult> addresses,
        List<EmployeeIdentificationResult> identifications,
        OffsetDateTime createdDate,
        OffsetDateTime lastModifiedDate
) {
    public static EmployeeDetailResult of(
            Employee employee,
            List<EmployeeAddress> addresses,
            List<EmployeeIdentification> identifications
    ) {
        return new EmployeeDetailResult(
                employee.getId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getWorkEmail(),
                employee.getStatus(),
                employee.getPosition() != null ? PositionListItemResult.of(employee.getPosition()) : null,
                employee.getDepartment() != null ? DepartmentDetailResult.ofInsideOffice(employee.getDepartment()) : null,
                employee.getAccessLevel() != null ? AccessLevelListItemResult.of(employee.getAccessLevel()) : null,
                EmployeeBioResult.of(employee.getBio()),
                EmployeeContactResult.of(employee.getContact()),
                addresses.stream().map(EmployeeAddressResult::of).toList(),
                identifications.stream().map(EmployeeIdentificationResult::of).toList(),
                DateTimeUtils.toOffsetUtc(employee.getCreatedDate()),
                DateTimeUtils.toOffsetUtc(employee.getLastModifiedDate())
        );
    }
}
