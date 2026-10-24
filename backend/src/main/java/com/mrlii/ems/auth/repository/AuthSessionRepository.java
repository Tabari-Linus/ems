package com.mrlii.ems.auth.repository;

import com.mrlii.ems.auth.entity.AuthSession;
import com.mrlii.ems.auth.enums.SessionRevocationReason;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    /** Row-locked so concurrent refreshes of the same token are serialized. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AuthSession> findByTokenHash(String tokenHash);

    List<AuthSession> findAllByUserAccount_IdAndRevokedAtIsNull(Long userAccountId);

    List<AuthSession> findAllByFamilyId(UUID familyId);

    @Modifying(flushAutomatically = true)
    @Query("""
            UPDATE AuthSession s SET s.revokedAt = :now, s.revokedReason = :reason
            WHERE s.familyId = :familyId AND s.revokedAt IS NULL
            """)
    int revokeFamily(@Param("familyId") UUID familyId,
                     @Param("reason") SessionRevocationReason reason,
                     @Param("now") Instant now);

    @Modifying(flushAutomatically = true)
    @Query("""
            UPDATE AuthSession s SET s.revokedAt = :now, s.revokedReason = :reason
            WHERE s.userAccount.id = :accountId AND s.revokedAt IS NULL
            """)
    int revokeAllOfAccount(@Param("accountId") Long accountId,
                           @Param("reason") SessionRevocationReason reason,
                           @Param("now") Instant now);

    @Modifying(flushAutomatically = true)
    @Query("""
            UPDATE AuthSession s SET s.revokedAt = :now, s.revokedReason = :reason
            WHERE s.userAccount.id = :accountId AND s.familyId <> :keepFamilyId AND s.revokedAt IS NULL
            """)
    int revokeAllOfAccountExceptFamily(@Param("accountId") Long accountId,
                                       @Param("keepFamilyId") UUID keepFamilyId,
                                       @Param("reason") SessionRevocationReason reason,
                                       @Param("now") Instant now);
}
