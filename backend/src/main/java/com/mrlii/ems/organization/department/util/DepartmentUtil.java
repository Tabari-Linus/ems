package com.mrlii.ems.organization.department.util;

import org.springframework.stereotype.Component;

@Component
public class DepartmentUtil {

    public boolean validateNotNull(String value) {
        return value != null && !value.isEmpty();
    }
}
