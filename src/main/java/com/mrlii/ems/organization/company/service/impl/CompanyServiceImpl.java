package com.mrlii.ems.organization.company.service.impl;

import com.mrlii.ems.organization.company.dto.*;
import com.mrlii.ems.organization.company.entity.Company;
import com.mrlii.ems.organization.company.helper.CompanyPersistenceHelper;
import com.mrlii.ems.organization.company.service.CompanyService;
import com.mrlii.ems.organization.company.helper.CompanyServiceHelper;
import com.mrlii.ems.common.dto.GeneralFilterInput;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyServiceImpl implements CompanyService {

    private final CompanyPersistenceHelper companyPersistenceHelper;
    private final CompanyServiceHelper companyServiceHelper;


    @Override
    @Transactional
    public CompanyResult createCompany(CreateCompanyInput input) {
        Company savedCompany = companyPersistenceHelper.persistNewCompany(input);
        log.info("Company created successfully: Id {}", savedCompany.getId());
        return CompanyResult.of(savedCompany);
    }

    @Override
    @Transactional
    public CompanyResult updateCompany(Long id, UpdateCompanyInput input) {
        Company updatedCompany = companyPersistenceHelper.updateCompany(id, input);
        return CompanyResult.of(updatedCompany);
    }

    @Override
    @Transactional
    public CompanyResult archiveCompany(Long id) {
        Company company = companyPersistenceHelper.archiveCompany(id);
        return CompanyResult.of(company);
    }

    @Override
    @Transactional
    public CompanyResult activateCompany(Long id, Boolean active) {
        Company company = companyPersistenceHelper.activateCompany(id, active);
        return CompanyResult.of(company);
    }

    @Override
    @Transactional
    public CompanyResult deleteCompany(Long id) {
        Company company = companyPersistenceHelper.deleteCompany(id);
        return CompanyResult.of(company);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyDetailResult getCompany(Long id) {
        Company company = companyServiceHelper.getCompanyById(id);
        return CompanyDetailResult.of(company);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<CompanyListItemResult> getCompanies(GeneralFilterInput filter, PageInput pageInput, SortInput sortInput) {
        return companyServiceHelper.getCompanies(filter, pageInput, sortInput);
    }
}
