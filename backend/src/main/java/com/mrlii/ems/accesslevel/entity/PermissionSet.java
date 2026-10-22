package com.mrlii.ems.accesslevel.entity;


import com.mrlii.ems.accesslevel.enums.Permission;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "access_level_permissions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_access_level_permission",
                columnNames = {"access_level_id", "permission_name"}
        )
)
@AllArgsConstructor
@RequiredArgsConstructor
@Getter
@Setter
@Builder
public class PermissionSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Permission permissionName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "access_level_id", nullable = false)
    private AccessLevel accessLevel;

}
