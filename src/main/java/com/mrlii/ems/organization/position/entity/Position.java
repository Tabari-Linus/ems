package com.mrlii.ems.organization.position.entity;

import com.mrlii.ems.common.entity.AuditableEntity;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.position.enums.PositionLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "positions")
@AllArgsConstructor
@RequiredArgsConstructor
@Getter
@Setter
@Builder
public class Position extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String positionName;

    @Enumerated(EnumType.STRING)
    private PositionLevel level;

    private String description;

    @Enumerated(EnumType.STRING)
    private CommonStatus status;

    private LocalDateTime deletedAt;
}
