package com.mrlii.ems.auth.repository;

import com.mrlii.ems.auth.entity.RefreshToken;
import com.mrlii.ems.auth.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    @Modifying
    void deleteByUserAccount(UserAccount user);
}
