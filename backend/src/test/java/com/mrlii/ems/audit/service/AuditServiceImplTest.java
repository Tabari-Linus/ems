package com.mrlii.ems.audit.service;

import com.mrlii.ems.audit.entity.AuditEvent;
import com.mrlii.ems.audit.enums.AuditAction;
import com.mrlii.ems.audit.repository.AuditEventRepository;
import com.mrlii.ems.audit.service.impl.AuditServiceImpl;
import com.mrlii.ems.common.dto.ClientInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditServiceImplTest {

    @Mock private AuditEventRepository repository;
    private AuditServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AuditServiceImpl(repository, JsonMapper.builder().build());
    }

    private AuditEvent saved() {
        ArgumentCaptor<AuditEvent> captor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void recordForAccount_storesActorClientAndJsonDetails() {
        service.recordForAccount(AuditAction.LOGIN_SUCCEEDED, 7L, new ClientInfo("1.2.3.4", "UA"), Map.of("k", "v"));

        AuditEvent event = saved();
        assertThat(event.getAction()).isEqualTo(AuditAction.LOGIN_SUCCEEDED);
        assertThat(event.getActorAccountId()).isEqualTo(7L);
        assertThat(event.getTargetType()).isEqualTo(AuditService.TARGET_USER_ACCOUNT);
        assertThat(event.getTargetId()).isEqualTo("7");
        assertThat(event.getIp()).isEqualTo("1.2.3.4");
        assertThat(event.getUserAgent()).isEqualTo("UA");
        assertThat(event.getDetails()).isEqualTo("{\"k\":\"v\"}");
        assertThat(event.getOccurredAt()).isNotNull();
    }

    @Test
    void record_withoutActorClientOrDetails_storesNulls() {
        service.recordForAccount(AuditAction.LOGIN_FAILED, null, null, Map.of());

        AuditEvent event = saved();
        assertThat(event.getActorAccountId()).isNull();
        assertThat(event.getTargetId()).isNull();
        assertThat(event.getIp()).isNull();
        assertThat(event.getDetails()).isNull();
    }

    @Test
    void clientInfo_truncatesAndBlanksToNull() {
        ClientInfo info = new ClientInfo(" ", "x".repeat(600));

        assertThat(info.ip()).isNull();
        assertThat(info.userAgent()).hasSize(512);
    }
}
