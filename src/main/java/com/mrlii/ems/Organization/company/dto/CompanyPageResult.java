package com.mrlii.ems.Organization.company.dto;

import java.util.List;

public record CompanyPageResult(
        int currentPage,
        int totalPages,
        int totalElements,
        int pageSize,
        boolean hasNext,
        boolean hasPrevious,
        List<CompanyListItemResult> data
) {
    public static CompanyPageResult of(int currentPage, int totalPages, int totalElements, int pageSize, boolean hasNext, boolean hasPrevious, List<CompanyListItemResult> data){
        return new CompanyPageResult(
                currentPage,
                totalPages,
                totalElements,
                pageSize,
                hasNext,
                hasPrevious,
                data    );
    }
}
