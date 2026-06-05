package com.mrlii.ems.common.dto;

import com.mrlii.ems.common.enums.SortDirection;
import com.mrlii.ems.common.exception.InputValidationException;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
public class PaginationHelper {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    public Sort buildSort(SortInput sortInput) {
        if (sortInput == null || sortInput.sortField() == null || sortInput.sortField().isBlank()) {
            return Sort.unsorted();
        }
        Sort.Direction direction = sortInput.sortDirection() == SortDirection.ASC
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return Sort.by(direction, sortInput.sortField());
    }

    public void validatePageSize(int size) {
        if (size < 1 || size > MAX_SIZE) {
            throw new InputValidationException(
                    "Invalid page size: received %d, but page.size must be between 1 and %d".formatted(size, MAX_SIZE));
        }
    }

    public Pageable buildPageable(PageInput pageInput, SortInput sortInput) {
        int page = pageInput != null && pageInput.page() != null ? pageInput.page() : DEFAULT_PAGE;
        int size = pageInput != null && pageInput.size() != null ? pageInput.size() : DEFAULT_SIZE;
        validatePageSize(size);
        return PageRequest.of(page, size, buildSort(sortInput));
    }
}
