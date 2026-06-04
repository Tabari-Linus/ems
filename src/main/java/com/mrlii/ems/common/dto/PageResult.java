package com.mrlii.ems.common.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public record PageResult<T>(
        int currentPage,
        int totalPages,
        int totalElements,
        int pageSize,
        boolean hasNext,
        boolean hasPrevious,
        List<T> data
) {
    public static<E, T> PageResult<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResult<>(
                page.getNumber(),
                page.getTotalPages(),
                (int) page.getTotalElements(),
                page.getSize(),
                page.hasNext(),
                page.hasPrevious(),
                page.getContent().stream().map(mapper).toList()
        );
    }
}
