package com.mrlii.ems.Organization.office.util;

import com.mrlii.ems.Organization.office.entity.Office;
import org.springframework.data.jpa.domain.Specification;

public class OfficeSpecification {

    public static Specification<Office> matchesSearch(String search) {
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("officeName")), pattern),
                    cb.like(cb.lower(root.get("officeCode")), pattern),
                    cb.like(cb.lower(root.get("officeEmail")), pattern),
                    cb.like(cb.lower(root.get("officePhoneNumber")), pattern),
                    cb.like(cb.lower(root.get("officeAddress")), pattern)
            );
        };
    }

    public static Specification<Office> hasStatus(String status) {
        return (root, query, cb) -> cb.equal(root.get("officeStatus"), status);
    }

    public static Specification<Office> belongsToCompany(Long companyId) {
        return (root, query, cb) -> cb.equal(root.get("company").get("id"), companyId);
    }
}
