package com.mrlii.ems.accesslevel.util;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.enums.Permission;
import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.accesslevel.repository.PermissionSetRepository;
import com.mrlii.ems.common.exception.BusinessRuleViolationException;
import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AccessLevelValidator {

    private final AccessLevelRepository accessLevelRepository;
    private final PermissionSetRepository permissionSetRepository;

    public void validateNameIsUnique(String name) {
        if (accessLevelRepository.existsByAccessLevelNameIgnoreCase(name)) {
            throw new DuplicateEntityException(
                    "An access level with the name '%s' already exists".formatted(name));
        }
    }

    public void validateNameIsUniqueForUpdate(Long id, String name) {
        if (accessLevelRepository.existsByAccessLevelNameIgnoreCaseAndIdNot(name, id)) {
            throw new DuplicateEntityException(
                    "An access level with the name '%s' already exists".formatted(name));
        }
    }

    public AccessLevel findByIdOrThrow(Long id) {
        return accessLevelRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Access level with ID %d not found".formatted(id)));
    }

    public void validateNotAssignedToEmployees(AccessLevel accessLevel) {
        int count = accessLevel.getEmployees() == null ? 0 : accessLevel.getEmployees().size();
        if (count > 0) {
            throw new BusinessRuleViolationException(
                    "Access level '%s' cannot be deleted — %d employee(s) are still assigned to it"
                            .formatted(accessLevel.getAccessLevelName(), count));
        }
    }

    public void validatePermissionsNotDuplicate(Long accessLevelId, List<Permission> permissions) {
        List<String> duplicates = permissions.stream()
                .filter(p -> permissionSetRepository.existsByAccessLevelIdAndPermissionName(accessLevelId, p))
                .map(Permission::name)
                .toList();

        if (!duplicates.isEmpty()) {
            throw new DuplicateEntityException(
                    "The following permissions are already assigned to this access level: %s"
                            .formatted(String.join(", ", duplicates)));
        }
    }
}
