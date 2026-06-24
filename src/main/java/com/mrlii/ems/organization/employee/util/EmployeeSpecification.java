package com.mrlii.ems.organization.employee.util;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.entity.Employee;
import org.springframework.data.jpa.domain.Specification;

public class EmployeeSpecification {

    private EmployeeSpecification() {}

    public static Specification<Employee> hasStatus(CommonStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Employee> hasDepartment(Long departmentId) {
        return (root, query, cb) -> cb.equal(root.get("department").get("id"), departmentId);
    }

    public static Specification<Employee> hasPosition(Long positionId) {
        return (root, query, cb) -> cb.equal(root.get("position").get("id"), positionId);
    }

    public static Specification<Employee> matchesSearch(String search) {
        return (root, query, cb) -> {
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("workEmail")), pattern)
            );
        };
    }

    public static Specification<Employee> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }
}
