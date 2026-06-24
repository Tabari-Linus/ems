package com.mrlii.ems.auth.seeder;

import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements ApplicationRunner {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (userAccountRepository.existsByEmail(adminEmail)) {
            return;
        }

        UserAccount admin = UserAccount.builder()
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .enabled(true)
                .build();

        userAccountRepository.save(admin);
        log.info("Admin account seeded: {}", adminEmail);
    }
}
