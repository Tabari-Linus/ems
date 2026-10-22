package com.mrlii.ems.organization.employee.dto;

import com.mrlii.ems.common.enums.CommonStatus;

public record EmployeeFilterInput(
        CommonStatus status,
        String search,
        Long departmentId,
        Long positionId
) {
}
