package com.mrlii.ems.auth.repository;

import com.mrlii.ems.auth.entity.OneTimeToken;
import com.mrlii.ems.auth.enums.OneTimeTokenPurpose;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OneTimeTokenRepository extends JpaRepository<OneTimeToken, Long> {

    /** Row-locked so a token can be consumed only once under concurrency. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<OneTimeToken> findByTokenHash(String tokenHash);

    /** Invalidates (deletes) the account's still-unused tokens of one purpose before a new one is issued. */
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM OneTimeToken t
            WHERE t.userAccount.id = :accountId AND t.purpose = :purpose AND t.usedAt IS NULL
            """)
    int deleteUnused(@Param("accountId") Long accountId, @Param("purpose") OneTimeTokenPurpose purpose);
}
