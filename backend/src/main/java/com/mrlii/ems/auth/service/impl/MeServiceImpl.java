package com.mrlii.ems.auth.service.impl;

import com.mrlii.ems.auth.dto.AccountResult;
import com.mrlii.ems.auth.dto.MeResult;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.auth.security.AuthenticatedAccount;
import com.mrlii.ems.auth.service.MeService;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.organization.employee.dto.EmployeeDetailResult;
import com.mrlii.ems.organization.employee.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class MeServiceImpl implements MeService {

    private final UserAccountRepository userAccountRepository;
    private final EmployeeService employeeService;

    @Override
    @Transactional(readOnly = true)
    public MeResult me(AuthenticatedAccount principal) {
        UserAccount account = userAccountRepository.findById(principal.accountId())
                .orElseThrow(() -> new EntityNotFoundException("Account not found"));
        AccountResult accountResult = new AccountResult(
                account.getPublicId().toString(),
                account.getEmail(),
                account.getLastLoginAt() == null ? null : account.getLastLoginAt().atOffset(ZoneOffset.UTC));
        EmployeeDetailResult employee = principal.employeeId() == null
                ? null
                : employeeService.getEmployee(principal.employeeId());
        return new MeResult(accountResult, employee, principal.sortedPermissions());
    }
}
