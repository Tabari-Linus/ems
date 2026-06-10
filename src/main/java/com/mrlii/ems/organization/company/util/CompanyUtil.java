package com.mrlii.ems.organization.company.util;

import org.springframework.stereotype.Component;

@Component
public class CompanyUtil {

    public boolean validateNotNull(String value){
        return value != null && !value.isEmpty();
    }
}
