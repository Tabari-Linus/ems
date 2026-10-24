package com.mrlii.ems.auth.service;

import com.mrlii.ems.auth.dto.MeResult;
import com.mrlii.ems.auth.security.AuthenticatedAccount;

public interface MeService {

    /** The caller's account, employee record and effective permissions. */
    MeResult me(AuthenticatedAccount principal);
}
