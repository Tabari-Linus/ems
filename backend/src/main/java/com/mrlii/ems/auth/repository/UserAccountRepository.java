package com.mrlii.ems.auth.repository;

import com.mrlii.ems.auth.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    /** {@code email} must already be normalized (lower-case). */
    boolean existsByEmail(String email);

    Optional<UserAccount> findByPublicId(UUID publicId);

    Optional<UserAccount> findByEmployee_Id(Long employeeId);

    /** Account with employee, access level and permissions, for login. {@code email} must be normalized. */
    @Query("""
            SELECT u FROM UserAccount u
            LEFT JOIN FETCH u.employee e
            LEFT JOIN FETCH e.accessLevel al
            LEFT JOIN FETCH al.permissions
            WHERE u.email = :email
            """)
    Optional<UserAccount> findByEmailWithAccess(@Param("email") String email);

    /** Account with employee, access level and permissions, for per-request authorization. */
    @Query("""
            SELECT u FROM UserAccount u
            LEFT JOIN FETCH u.employee e
            LEFT JOIN FETCH e.accessLevel al
            LEFT JOIN FETCH al.permissions
            WHERE u.publicId = :publicId
            """)
    Optional<UserAccount> findByPublicIdWithAccess(@Param("publicId") UUID publicId);

    @Query("""
            SELECT u FROM UserAccount u
            LEFT JOIN FETCH u.employee e
            LEFT JOIN FETCH e.accessLevel al
            LEFT JOIN FETCH al.permissions
            WHERE u.id = :id
            """)
    Optional<UserAccount> findByIdWithAccess(@Param("id") Long id);
}
