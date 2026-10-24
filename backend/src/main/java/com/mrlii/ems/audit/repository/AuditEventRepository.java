package com.mrlii.ems.audit.repository;

import com.mrlii.ems.audit.entity.AuditEvent;
import com.mrlii.ems.audit.enums.AuditAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

    List<AuditEvent> findAllByActorAccountIdAndActionOrderByIdAsc(Long actorAccountId, AuditAction action);
}
