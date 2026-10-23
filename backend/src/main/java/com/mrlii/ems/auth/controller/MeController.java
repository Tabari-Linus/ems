package com.mrlii.ems.auth.controller;

import com.mrlii.ems.auth.dto.MeResult;
import com.mrlii.ems.auth.security.CurrentAccountProvider;
import com.mrlii.ems.auth.service.MeService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class MeController {

    private final MeService meService;
    private final CurrentAccountProvider currentAccountProvider;

    /** Any authenticated caller; no extra permission. */
    @PreAuthorize("isAuthenticated()")
    @QueryMapping
    public MeResult me() {
        return meService.me(currentAccountProvider.requireAccount());
    }
}
