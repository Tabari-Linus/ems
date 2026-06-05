package com.mrlii.ems.Organization.department.util;

import com.mrlii.ems.Organization.department.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DepartmentCodeGenerator {

    private final DepartmentRepository departmentRepository;

    public String generateDepartmentPrefix(String departmentName) {
        return Arrays.stream(departmentName.split("\\s+"))
                .filter(word -> !word.isEmpty())
                .map(word -> String.valueOf(word.charAt(0)))
                .collect(Collectors.joining())
                .toUpperCase();
    }

    public String generateUniqueDepartmentCode(String prefix, String officeCode) {
        String baseCode = prefix + "-" + officeCode.replaceAll("^0+", "");
        String uniqueCode = baseCode;
        int suffix = 1;

        while (departmentRepository.existsByDepartmentCodeIgnoreCase(uniqueCode)) {
            uniqueCode = baseCode + "-" + String.format("%02d", suffix++);
        }

        return uniqueCode;
    }
}
