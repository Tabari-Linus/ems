package com.mrlii.ems.Organization.company.util;

import com.mrlii.ems.Organization.company.entity.Company;
import org.springframework.data.jpa.domain.Specification;

public class CompanySpecification {

    public static Specification<Company> matchesSearch(String search){
        return (root, query, criteriaBuilder) -> {
            String likePattern = "%" + search.toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("companyName")), likePattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("companyCode")), likePattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("companyEmail")), likePattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("companyPhoneNumber")), likePattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("companyAddress")), likePattern)
            );
        };
    }

    public static Specification<Company> hasStatus(String status){
        return (root, query, criteriaBuilder) -> {
            return criteriaBuilder.equal(root.get("companyStatus"), status);
        };
    }


}
