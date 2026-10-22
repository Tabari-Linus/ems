package com.mrlii.ems.accesslevel.repository;

import com.mrlii.ems.accesslevel.entity.PermissionSet;
import com.mrlii.ems.accesslevel.enums.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermissionSetRepository extends JpaRepository<PermissionSet, Long> {

    List<PermissionSet> findAllByAccessLevelId(Long accessLevelId);

    boolean existsByAccessLevelIdAndPermissionName(Long accessLevelId, Permission permissionName);

    void deleteAllByAccessLevelIdAndPermissionNameIn(Long accessLevelId, List<Permission> permissionNames);
}
