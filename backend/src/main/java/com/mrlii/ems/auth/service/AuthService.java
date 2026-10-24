package com.mrlii.ems.auth.service;

import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.ChangePasswordRequest;
import com.mrlii.ems.auth.dto.LoginRequest;
import com.mrlii.ems.auth.dto.SetPasswordRequest;
import com.mrlii.ems.common.dto.ClientInfo;

import java.util.UUID;

public interface AuthService {

    /** Verifies credentials and starts a new session family (other devices keep their sessions). */
    AuthTokenPair login(LoginRequest request, ClientInfo client);

    /** Rotates the session of {@code refreshToken}; a revoked token revokes its whole family. */
    AuthTokenPair refresh(String refreshToken, ClientInfo client);

    /** Ends the session (family) of {@code refreshToken}, if any. */
    void logout(String refreshToken, ClientInfo client);

    /** Ends every session of the account. */
    void logoutAll(Long accountId, ClientInfo client);

    /** Redeems a one-time token, sets the password, activates a PENDING employee and ends all sessions. */
    void setPassword(SetPasswordRequest request, ClientInfo client);

    /** Changes the password and ends every session except {@code currentSessionFamilyId}. */
    void changePassword(Long accountId, UUID currentSessionFamilyId, ChangePasswordRequest request, ClientInfo client);

    /** Ends every session of the employee's account (deactivation / archive). Runs in its own transaction. */
    int revokeSessionsOfEmployee(Long employeeId);
}
