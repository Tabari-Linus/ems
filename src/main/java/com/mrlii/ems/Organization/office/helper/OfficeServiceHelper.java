package com.mrlii.ems.Organization.office.helper;

import com.mrlii.ems.Organization.office.dto.OfficeListItemResult;
import com.mrlii.ems.Organization.office.entity.Office;
import com.mrlii.ems.Organization.office.repository.OfficeRepository;
import com.mrlii.ems.Organization.office.util.OfficeSpecification;
import com.mrlii.ems.common.dto.*;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.PaginationHelper;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.InputValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OfficeServiceHelper {

    private final OfficeRepository officeRepository;
    private final PaginationHelper paginationHelper;

    public void validateUniqueName(String officeName) {
        if (officeName != null && officeRepository.existsByOfficeNameIgnoreCase(officeName)) {
            throw new InputValidationException(
                    "An office with the name '%s' already exists".formatted(officeName));
        }
    }

    public void validateUniqueCode(String officeCode) {
        if (officeCode != null && officeRepository.existsByOfficeCodeIgnoreCase(officeCode)) {
            throw new InputValidationException(
                    "An office with the code '%s' already exists".formatted(officeCode));
        }
    }

    public void validateUniqueEmail(String officeEmail) {
        if (officeEmail != null && officeRepository.existsByOfficeEmailIgnoreCase(officeEmail)) {
            throw new InputValidationException(
                    "An office with the email '%s' already exists".formatted(officeEmail));
        }
    }

    public Office getOfficeById(Long id) {
        return officeRepository.findById(id)
                .orElseThrow(() -> new InputValidationException(
                        "Office with ID %d does not exist".formatted(id)));
    }

    public PageResult<OfficeListItemResult> getOffices(Long companyId, GeneralFilterInput filter, PageInput pageInput, SortInput sortInput) {
        CommonStatus status = filter != null ? filter.status() : null;
        String search = filter != null ? filter.search() : null;

        List<Specification<Office>> specs = new ArrayList<>();

        if (companyId != null) {
            specs.add(OfficeSpecification.belongsToCompany(companyId));
        }
        if (status != null) {
            specs.add(OfficeSpecification.hasStatus(status.name()));
        }
        if (search != null && !search.isBlank()) {
            specs.add(OfficeSpecification.matchesSearch(search));
        }

        Specification<Office> spec = Specification.allOf(specs);
        Pageable pageable = paginationHelper.buildPageable(pageInput, sortInput);
        Page<Office> officePage = officeRepository.findAll(spec, pageable);

        return PageResult.of(officePage, OfficeListItemResult::of);
    }
}
