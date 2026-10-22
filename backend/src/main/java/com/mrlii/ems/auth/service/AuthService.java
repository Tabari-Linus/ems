package com.mrlii.ems.auth.service;

import com.mrlii.ems.auth.dto.AuthTokenPair;
import com.mrlii.ems.auth.dto.LoginRequest;

public interface AuthService {

    AuthTokenPair login(LoginRequest request);

    AuthTokenPair refreshToken(String refreshToken);

    void logout(String refreshToken);
}
