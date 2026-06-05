package com.mrlii.ems.Organization.company.service;

import com.mrlii.ems.Organization.company.dto.*;
import com.mrlii.ems.common.dto.GeneralFilterInput;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;

public interface CompanyService {

    CompanyResult createCompany(CreateCompanyInput input);

    CompanyResult updateCompany(Long companyId, UpdateCompanyInput input);

    CompanyResult archiveCompany(Long companyId);

    CompanyResult activateCompany(Long companyId, Boolean active);

    CompanyResult deleteCompany(Long companyId);

    CompanyDetailResult getCompany(Long id);

    PageResult<CompanyListItemResult> getCompanies(GeneralFilterInput filter, PageInput pageInput, SortInput sortInput);
}
