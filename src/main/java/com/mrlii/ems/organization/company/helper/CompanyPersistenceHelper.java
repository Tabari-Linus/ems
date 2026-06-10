package com.mrlii.ems.organization.company.helper;

import com.mrlii.ems.organization.company.dto.CreateCompanyInput;
import com.mrlii.ems.organization.company.dto.UpdateCompanyInput;
import com.mrlii.ems.organization.company.entity.Company;
import com.mrlii.ems.organization.company.repository.CompanyRepository;
import com.mrlii.ems.organization.company.util.CompanyUtil;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.common.util.CommonUtilHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CompanyPersistenceHelper {

    private final CompanyRepository companyRepository;

    private final CommonUtilHelper commonUtilHelper;
    private final CompanyServiceHelper companyServiceHelper;
    private final CompanyUtil companyUtil;


    public Company persistNewCompany(CreateCompanyInput input) {
        companyServiceHelper.validateUniqueName(input.companyName());
        companyServiceHelper.validateUniqueCode(input.companyCode());
        companyServiceHelper.validateUniqueEmail(input.companyEmail());

        Company company = Company.builder()
                .companyName(commonUtilHelper.normalizeName(input.companyName()))
                .companyCode(commonUtilHelper.normalizeName(input.companyCode()))
                .companyEmail(commonUtilHelper.normalizeName(input.companyEmail()))
                .companyPhoneNumber(input.companyPhoneNumber())
                .companyAddress(input.companyAddress())
                .companyStatus(CommonStatus.ACTIVE)
                .build();

        return companyRepository.save(company);
    }

    public Company updateCompany(Long companyId, UpdateCompanyInput input) {

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Company with ID %d not found".formatted(companyId)));

        companyServiceHelper.validateUniqueName(input.companyName());
        companyServiceHelper.validateUniqueCode(input.companyCode());
        companyServiceHelper.validateUniqueEmail(input.companyEmail());

        if (companyUtil.validateNotNull(input.companyName())) {
            company.setCompanyName(commonUtilHelper.normalizeName(input.companyName()));
        }
        if (companyUtil.validateNotNull(input.companyCode())) {
            company.setCompanyCode(commonUtilHelper.normalizeName(input.companyCode()));
        }
        if (companyUtil.validateNotNull(input.companyEmail())) {
            company.setCompanyEmail(commonUtilHelper.normalizeName(input.companyEmail()));
        }
        if (companyUtil.validateNotNull(input.companyPhoneNumber())) {
            company.setCompanyPhoneNumber(input.companyPhoneNumber());
        }
        if (companyUtil.validateNotNull(input.companyAddress())) {
            company.setCompanyAddress(input.companyAddress());
        }
        return companyRepository.save(company);
    }

    public Company archiveCompany(Long companyId) {
        Company company = companyServiceHelper.getCompanyById(companyId);
        company.setCompanyStatus(CommonStatus.ARCHIVED);
        return companyRepository.save(company);

    }

    public Company activateCompany(Long companyId, Boolean active) {
        Company company = companyServiceHelper.getCompanyById(companyId);
        company.setCompanyStatus(active ? CommonStatus.ACTIVE : CommonStatus.INACTIVE);
        return companyRepository.save(company);
        }

    public Company deleteCompany(Long companyId) {
        Company company = companyServiceHelper.getCompanyById(companyId);
        company.setCompanyStatus(CommonStatus.ARCHIVED);
        company.setDeletedAt(commonUtilHelper.getCurrentDateTime());
        return companyRepository.save(company);
    }
}