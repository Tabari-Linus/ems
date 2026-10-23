package com.mrlii.ems.common.util;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class CommonUtilHelper {

    public String normalizeName(String name){
        return name.strip();
    }

    public LocalDateTime getCurrentDateTime() {
        return LocalDateTime.now();
    }
}
