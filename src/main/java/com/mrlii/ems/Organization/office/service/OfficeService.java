package com.mrlii.ems.Organization.office.service;

import com.mrlii.ems.Organization.office.dto.*;
import com.mrlii.ems.common.dto.GeneralFilterInput;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;

public interface OfficeService {

    OfficeResult createOffice(CreateOfficeInput input);

    OfficeResult updateOffice(Long officeId, UpdateOfficeInput input);

    OfficeResult archiveOffice(Long officeId);

    OfficeResult activateOffice(Long officeId, Boolean active);

    OfficeResult deleteOffice(Long officeId);

    OfficeDetailResult getOffice(Long id);

    PageResult<OfficeListItemResult> getOffices(Long companyId, GeneralFilterInput filter, PageInput pageInput, SortInput sortInput);
}
