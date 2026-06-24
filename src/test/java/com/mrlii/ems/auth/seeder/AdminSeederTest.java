package com.mrlii.ems.auth.seeder;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.auth.entity.UserAccount;
import com.mrlii.ems.auth.repository.UserAccountRepository;
import com.mrlii.ems.common.config.AdminProperties;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminSeederTest {

    @Mock private UserAccountRepository userAccountRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private AccessLevelRepository accessLevelRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AdminProperties adminProperties;

    @InjectMocks private AdminSeeder adminSeeder;

    private static final String ADMIN_EMAIL = "admin@example.com";
    private static final String ADMIN_PASSWORD = "secret";

    @Test
    void run_createsEmployeeAndUserAccount_whenAdminDoesNotExist() {
        AccessLevel adminLevel = AccessLevel.builder()
                .id(1L)
                .accessLevelName("ADMINISTRATOR")
                .status(CommonStatus.ACTIVE)
                .build();

        when(adminProperties.email()).thenReturn(ADMIN_EMAIL);
        when(adminProperties.password()).thenReturn(ADMIN_PASSWORD);
        when(userAccountRepository.existsByEmail(ADMIN_EMAIL)).thenReturn(false);
        when(accessLevelRepository.findByAccessLevelNameIgnoreCase("ADMINISTRATOR"))
                .thenReturn(Optional.of(adminLevel));

        when(passwordEncoder.encode(ADMIN_PASSWORD)).thenReturn("hashed");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> i.getArguments()[0]);
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(i -> i.getArguments()[0]);

        adminSeeder.run(mock(ApplicationArguments.class));

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(employeeCaptor.capture());
        Employee savedEmployee = employeeCaptor.getValue();
        assertThat(savedEmployee.getFirstName()).isEqualTo("System");
        assertThat(savedEmployee.getLastName()).isEqualTo("Administrator");
        assertThat(savedEmployee.getStatus()).isEqualTo(CommonStatus.ACTIVE);
        assertThat(savedEmployee.getAccessLevel()).isEqualTo(adminLevel);

        ArgumentCaptor<UserAccount> accountCaptor = ArgumentCaptor.forClass(UserAccount.class);
        verify(userAccountRepository).save(accountCaptor.capture());
        UserAccount savedAccount = accountCaptor.getValue();
        assertThat(savedAccount.getEmail()).isEqualTo(ADMIN_EMAIL);
        assertThat(savedAccount.getPasswordHash()).isEqualTo("hashed");
        assertThat(savedAccount.isEnabled()).isTrue();
        assertThat(savedAccount.getEmployee()).isEqualTo(savedEmployee);
    }

    @Test
    void run_skipsCreation_whenAdminAlreadyExists() {
        when(adminProperties.email()).thenReturn(ADMIN_EMAIL);
        when(userAccountRepository.existsByEmail(ADMIN_EMAIL)).thenReturn(true);

        adminSeeder.run(mock(ApplicationArguments.class));

        verify(employeeRepository, never()).save(any());
        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void run_skipsCreation_whenAdministratorAccessLevelNotFound() {
        when(adminProperties.email()).thenReturn(ADMIN_EMAIL);
        when(userAccountRepository.existsByEmail(ADMIN_EMAIL)).thenReturn(false);
        when(accessLevelRepository.findByAccessLevelNameIgnoreCase("ADMINISTRATOR"))
                .thenReturn(Optional.empty());

        adminSeeder.run(mock(ApplicationArguments.class));

        verify(employeeRepository, never()).save(any());
        verify(userAccountRepository, never()).save(any());
    }
}
