package com.mrlii.ems.domain.entity.base;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;

@Getter
@Setter
@MappedSuperclass
@SQLRestriction("deleted_at IS NULL")
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public abstract class SoftDeletableEntity extends BaseEntity {

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public boolean isDeleted() {
        return deletedAt != null;
    }
}
