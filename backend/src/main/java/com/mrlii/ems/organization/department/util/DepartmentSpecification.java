package com.mrlii.ems.organization.department.util;

import com.mrlii.ems.organization.department.entity.Department;
import org.springframework.data.jpa.domain.Specification;

public class DepartmentSpecification {

    private DepartmentSpecification() {}

    public static Specification<Department> matchesSearch(String search) {
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("departmentName")), pattern),
                    cb.like(cb.lower(root.get("departmentCode")), pattern),
                    cb.like(cb.lower(root.get("departmentEmail")), pattern),
                    cb.like(cb.lower(root.get("departmentPhoneNumber")), pattern),
                    cb.like(cb.lower(root.get("departmentAddress")), pattern)
            );
        };
    }

    public static Specification<Department> hasStatus(String status) {
        return (root, query, cb) -> cb.equal(root.get("departmentStatus"), status);
    }

    public static Specification<Department> belongsToOffice(Long officeId) {
        return (root, query, cb) -> cb.equal(root.get("office").get("id"), officeId);
    }
}
