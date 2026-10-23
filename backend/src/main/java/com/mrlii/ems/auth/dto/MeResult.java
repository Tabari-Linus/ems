package com.mrlii.ems.auth.dto;

import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.organization.employee.dto.EmployeeDetailResult;

import java.util.List;

/** GraphQL {@code Me}. */
public record MeResult(AccountResult account, EmployeeDetailResult employee, List<Permission> permissions) {}
