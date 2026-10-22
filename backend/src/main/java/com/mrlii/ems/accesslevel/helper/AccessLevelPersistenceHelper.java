package com.mrlii.ems.accesslevel.helper;

import com.mrlii.ems.accesslevel.dto.CreateAccessLevelInput;
import com.mrlii.ems.accesslevel.dto.UpdateAccessLevelInput;
import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.entity.PermissionSet;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.accesslevel.repository.PermissionSetRepository;
import com.mrlii.ems.accesslevel.util.AccessLevelValidator;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.util.CommonUtilHelper;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AccessLevelPersistenceHelper {

    private final AccessLevelRepository accessLevelRepository;
    private final PermissionSetRepository permissionSetRepository;
    private final EmployeeRepository employeeRepository;
    private final AccessLevelValidator validator;
    private final CommonUtilHelper commonUtilHelper;

    public AccessLevel create(CreateAccessLevelInput input) {
        validator.validateNameIsUnique(input.accessLevelName());

        AccessLevel accessLevel = AccessLevel.builder()
                .accessLevelName(commonUtilHelper.normalizeName(input.accessLevelName()))
                .description(input.description())
                .status(CommonStatus.ACTIVE)
                .build();

        AccessLevel saved = accessLevelRepository.save(accessLevel);

        List<PermissionSet> permissionSets = input.permissions().stream()
                .map(p -> PermissionSet.builder()
                        .permissionName(p)
                        .accessLevel(saved)
                        .build())
                .toList();
        permissionSetRepository.saveAll(permissionSets);

        assignEmployees(input.employeeIds(), saved);

        return saved;
    }

    public AccessLevel update(Long id, UpdateAccessLevelInput input) {
        AccessLevel accessLevel = validator.findByIdOrThrow(id);

        if (input.accessLevelName() != null && !input.accessLevelName().isBlank()) {
            validator.validateNameIsUniqueForUpdate(id, input.accessLevelName());
            accessLevel.setAccessLevelName(commonUtilHelper.normalizeName(input.accessLevelName()));
        }
        if (input.description() != null) {
            accessLevel.setDescription(input.description());
        }

        AccessLevel saved = accessLevelRepository.save(accessLevel);

        assignEmployees(input.addEmployeeIds(), saved);
        unassignEmployees(input.removeEmployeeIds());

        return saved;
    }

    public AccessLevel activate(Long id) {
        AccessLevel accessLevel = validator.findByIdOrThrow(id);
        accessLevel.setStatus(CommonStatus.ACTIVE);
        return accessLevelRepository.save(accessLevel);
    }

    public AccessLevel archive(Long id) {
        AccessLevel accessLevel = validator.findByIdOrThrow(id);
        accessLevel.setStatus(CommonStatus.ARCHIVED);
        return accessLevelRepository.save(accessLevel);
    }

    public void softDelete(Long id) {
        AccessLevel accessLevel = validator.findByIdOrThrow(id);
        validator.validateNotAssignedToEmployees(accessLevel);
        accessLevel.setStatus(CommonStatus.ARCHIVED);
        accessLevel.setDeletedAt(commonUtilHelper.getCurrentDateTime());
        accessLevelRepository.save(accessLevel);
    }

    public AccessLevel addPermissions(Long id, List<Permission> permissions) {
        AccessLevel accessLevel = validator.findByIdOrThrow(id);
        validator.validatePermissionsNotDuplicate(id, permissions);

        List<PermissionSet> newPermissions = permissions.stream()
                .map(p -> PermissionSet.builder()
                        .permissionName(p)
                        .accessLevel(accessLevel)
                        .build())
                .toList();

        permissionSetRepository.saveAll(newPermissions);
        return accessLevel;
    }

    public AccessLevel removePermissions(Long id, List<Permission> permissions) {
        AccessLevel accessLevel = validator.findByIdOrThrow(id);
        permissionSetRepository.deleteAllByAccessLevelIdAndPermissionNameIn(id, permissions);
        return accessLevel;
    }

    private void assignEmployees(List<Long> employeeIds, AccessLevel accessLevel) {
        if (employeeIds == null || employeeIds.isEmpty()) return;
        List<Employee> employees = employeeRepository.findAllById(employeeIds);
        employees.forEach(e -> e.setAccessLevel(accessLevel));
        employeeRepository.saveAll(employees);
    }

    private void unassignEmployees(List<Long> employeeIds) {
        if (employeeIds == null || employeeIds.isEmpty()) return;
        List<Employee> employees = employeeRepository.findAllById(employeeIds);
        employees.forEach(e -> e.setAccessLevel(null));
        employeeRepository.saveAll(employees);
    }
}
