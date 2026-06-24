package com.mrlii.ems.auth.repository;

import com.mrlii.ems.auth.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    boolean existsByEmail(String email);

    Optional<UserAccount> findByUserId(UUID userId);

    @Query("""
            SELECT u FROM UserAccount u
            LEFT JOIN FETCH u.employee e
            LEFT JOIN FETCH e.accessLevel al
            LEFT JOIN FETCH al.permissions
            WHERE u.email = :email
            """)
    Optional<UserAccount> findByEmailWithPermissions(@Param("email") String email);
}
