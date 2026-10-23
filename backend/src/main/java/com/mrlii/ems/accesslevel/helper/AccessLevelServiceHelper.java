package com.mrlii.ems.accesslevel.helper;

import com.mrlii.ems.accesslevel.dto.AccessLevelFilterInput;
import com.mrlii.ems.accesslevel.dto.AccessLevelListItemResult;
import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.accesslevel.repository.AccessLevelRepository;
import com.mrlii.ems.accesslevel.util.AccessLevelSpecification;
import com.mrlii.ems.accesslevel.util.AccessLevelValidator;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.PaginationHelper;
import com.mrlii.ems.common.Pagination.SortInput;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AccessLevelServiceHelper {

    private final AccessLevelRepository accessLevelRepository;
    private final AccessLevelValidator validator;
    private final PaginationHelper paginationHelper;

    public AccessLevel findByIdOrThrow(Long id) {
        return validator.findByIdOrThrow(id);
    }

    public PageResult<AccessLevelListItemResult> getAccessLevels(
            AccessLevelFilterInput filter, PageInput pageInput, SortInput sortInput) {

        List<Specification<AccessLevel>> specs = new ArrayList<>();
        specs.add(AccessLevelSpecification.notDeleted());

        if (filter != null) {
            if (filter.status() != null) {
                specs.add(AccessLevelSpecification.hasStatus(filter.status()));
            }
            if (filter.search() != null && !filter.search().isBlank()) {
                specs.add(AccessLevelSpecification.matchesSearch(filter.search()));
            }
        }

        Pageable pageable = paginationHelper.buildPageable(pageInput, sortInput);
        Page<AccessLevel> page = accessLevelRepository.findAll(Specification.allOf(specs), pageable);

        return PageResult.of(page, AccessLevelListItemResult::of);
    }
}
