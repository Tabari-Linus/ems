package com.mrlii.ems.Organization.office.util;

import org.springframework.stereotype.Component;

@Component
public class OfficeUtil {

    public boolean validateNotNull(String value) {
        return value != null && !value.isEmpty();
    }
}
