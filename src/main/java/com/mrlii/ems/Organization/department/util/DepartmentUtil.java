package com.mrlii.ems.Organization.department.util;

import org.springframework.stereotype.Component;

@Component
public class DepartmentUtil {

    public boolean validateNotNull(String value) {
        return value != null && !value.isEmpty();
    }
}
