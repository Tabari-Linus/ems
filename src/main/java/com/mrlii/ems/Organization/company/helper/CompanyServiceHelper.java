package com.mrlii.ems.Organization.company.helper;

import com.mrlii.ems.Organization.company.dto.CompanyListItemResult;
import com.mrlii.ems.Organization.company.entity.Company;
import com.mrlii.ems.Organization.company.repository.CompanyRepository;
import com.mrlii.ems.Organization.company.util.CompanySpecification;
import com.mrlii.ems.common.dto.*;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.PaginationHelper;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.InputValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
@Component
public class CompanyServiceHelper {

    private final CompanyRepository companyRepository;
    private final PaginationHelper paginationHelper;

    public void validateUniqueName(String companyName) {
        if (companyRepository.existsByCompanyNameIgnoreCase(companyName)) {
            throw new InputValidationException(
                    "A company with the name '%s' already exists".formatted(companyName));
        }
    }

    public void validateUniqueCode(String companyCode) {
        if (companyRepository.existsByCompanyCodeIgnoreCase(companyCode)){
            throw new InputValidationException(
                    "A company with the code '%s' already exists".formatted(companyCode));
        }

    }

    public void validateUniqueEmail(String companyEmail) {
        if (companyRepository.existsByCompanyEmailIgnoreCase(companyEmail)) {
            throw new InputValidationException(
                    "A company with the email '%s' already exists".formatted(companyEmail));
        }
    }

    public void validateCompanyExists(Long companyId) {
        if (!companyRepository.existsById(companyId)) {
            throw new InputValidationException(
                    "Company with ID %d does not exist".formatted(companyId));
        }
    }

    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new InputValidationException(
                        "Company with ID %d does not exist".formatted(id)));
    }

    public PageResult<CompanyListItemResult> getCompanies(GeneralFilterInput filter, PageInput pageInput, SortInput sortInput) {
        CommonStatus status = filter !=null ? filter.status() : null;
        String search = filter != null ? filter.search() : null;

        List<Specification<Company>> specs = new ArrayList<>();

        if (status != null) {
            specs.add(CompanySpecification.hasStatus(status.name()));
        }

        if (search != null && !search.isBlank()) {
            specs.add(CompanySpecification.matchesSearch(search));
        }

        Specification<Company> spec = Specification.allOf(specs);

        Pageable pageable = paginationHelper.buildPageable(pageInput, sortInput);
        Page<Company> companyPage = companyRepository.findAll(spec, pageable);

        return PageResult.of(
                companyPage,
                CompanyListItemResult::of
                );
    }
}