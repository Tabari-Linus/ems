package com.mrlii.ems.organization.position.util;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.enums.PositionLevel;
import org.springframework.data.jpa.domain.Specification;

public class PositionSpecification {

    private PositionSpecification() {}

    public static Specification<Position> hasStatus(CommonStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Position> hasLevel(PositionLevel level) {
        return (root, query, cb) -> cb.equal(root.get("level"), level);
    }

    public static Specification<Position> matchesSearch(String search) {
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("positionName")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        };
    }

    public static Specification<Position> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }
}
