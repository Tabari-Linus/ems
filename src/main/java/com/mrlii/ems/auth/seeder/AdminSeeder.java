package com.mrlii.ems.auth.seeder;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.common.config.AdminProperties;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements ApplicationRunner {

    private final UserAccountRepository userAccountRepository;
    private final EmployeeRepository employeeRepository;
    private final AccessLevelRepository accessLevelRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminProperties adminProperties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userAccountRepository.existsByEmail(adminProperties.email())) {
            return;
        }

        AccessLevel adminAccessLevel = accessLevelRepository
                .findByAccessLevelNameIgnoreCase("ADMINISTRATOR")
                .orElse(null);
        if (adminAccessLevel == null) {
            log.warn("ADMINISTRATOR access level not found — skipping admin seeding (run V8 migration first)");
            return;
        }

        Employee adminEmployee = Employee.builder()
                .firstName("System")
                .lastName("Administrator")
                .status(CommonStatus.ACTIVE)
                .accessLevel(adminAccessLevel)
                .build();
        adminEmployee = employeeRepository.save(adminEmployee);

        UserAccount admin = UserAccount.builder()
                .email(adminProperties.email())
                .passwordHash(passwordEncoder.encode(adminProperties.password()))
                .enabled(true)
                .employee(adminEmployee)
                .build();
        userAccountRepository.save(admin);
        log.info("Admin account seeded: {}", adminProperties.email());
    }
}
