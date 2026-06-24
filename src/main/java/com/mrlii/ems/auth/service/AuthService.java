package com.mrlii.ems.auth.service;

import com.mrlii.ems.auth.dto.AuthResponse;
import com.mrlii.ems.auth.dto.LoginRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);
}
