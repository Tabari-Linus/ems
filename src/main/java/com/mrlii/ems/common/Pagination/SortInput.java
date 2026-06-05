package com.mrlii.ems.common.dto;

import com.mrlii.ems.common.enums.SortDirection;

public record SortInput(
      String sortField,
      SortDirection sortDirection
) {
}
