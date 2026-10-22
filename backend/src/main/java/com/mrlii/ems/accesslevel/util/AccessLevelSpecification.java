package com.mrlii.ems.accesslevel.util;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.common.enums.CommonStatus;
import org.springframework.data.jpa.domain.Specification;

public class AccessLevelSpecification {

    private AccessLevelSpecification() {}

    public static Specification<AccessLevel> hasStatus(CommonStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<AccessLevel> matchesSearch(String search) {
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("accessLevelName")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            );
        };
    }

    public static Specification<AccessLevel> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }
}
