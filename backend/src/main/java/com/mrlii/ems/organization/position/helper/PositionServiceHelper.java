package com.mrlii.ems.organization.position.helper;

import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.PaginationHelper;
import com.mrlii.ems.common.Pagination.SortInput;
import com.mrlii.ems.organization.position.dto.PositionFilterInput;
import com.mrlii.ems.organization.position.dto.PositionListItemResult;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.repository.PositionRepository;
import com.mrlii.ems.organization.position.util.PositionSpecification;
import com.mrlii.ems.organization.position.util.PositionValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PositionServiceHelper {

    private final PositionRepository positionRepository;
    private final PositionValidator validator;
    private final PaginationHelper paginationHelper;

    public Position findByIdOrThrow(Long id) {
        return validator.findByIdOrThrow(id);
    }

    public PageResult<PositionListItemResult> getPositions(
            PositionFilterInput filter, PageInput pageInput, SortInput sortInput) {

        List<Specification<Position>> specs = new ArrayList<>();
        specs.add(PositionSpecification.notDeleted());

        if (filter != null) {
            if (filter.status() != null) {
                specs.add(PositionSpecification.hasStatus(filter.status()));
            }
            if (filter.level() != null) {
                specs.add(PositionSpecification.hasLevel(filter.level()));
            }
            if (filter.search() != null && !filter.search().isBlank()) {
                specs.add(PositionSpecification.matchesSearch(filter.search()));
            }
        }

        Pageable pageable = paginationHelper.buildPageable(pageInput, sortInput);
        Page<Position> page = positionRepository.findAll(Specification.allOf(specs), pageable);

        return PageResult.of(page, PositionListItemResult::of);
    }
}
