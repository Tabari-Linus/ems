package com.mrlii.ems.audit.service.impl;

import com.mrlii.ems.audit.entity.AuditEvent;
import com.mrlii.ems.audit.enums.AuditAction;
import com.mrlii.ems.audit.repository.AuditEventRepository;
import com.mrlii.ems.audit.service.AuditService;
import com.mrlii.ems.common.dto.ClientInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditEventRepository auditEventRepository;
    private final JsonMapper jsonMapper;

    @Override
    @Transactional
    public void record(AuditAction action, Long actorAccountId, String targetType, String targetId,
                       ClientInfo client, Map<String, ?> details) {
        ClientInfo origin = client == null ? ClientInfo.UNKNOWN : client;
        AuditEvent event = AuditEvent.builder()
                .occurredAt(Instant.now())
                .actorAccountId(actorAccountId)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .ip(origin.ip())
                .userAgent(origin.userAgent())
                .details(details == null || details.isEmpty() ? null : jsonMapper.writeValueAsString(details))
                .build();
        auditEventRepository.save(event);
        log.info("Audit {} actor={} target={}:{}", action, actorAccountId, targetType, targetId);
    }
}
