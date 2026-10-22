package com.mrlii.ems.organization.office.helper;

import com.mrlii.ems.organization.company.entity.Company;
import com.mrlii.ems.organization.company.helper.CompanyServiceHelper;
import com.mrlii.ems.organization.office.dto.CreateOfficeInput;
import com.mrlii.ems.organization.office.dto.UpdateOfficeInput;
import com.mrlii.ems.organization.office.entity.Office;
import com.mrlii.ems.organization.office.repository.OfficeRepository;
import com.mrlii.ems.organization.office.util.OfficeUtil;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.common.util.CommonUtilHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OfficePersistenceHelper {

    private final OfficeRepository officeRepository;
    private final OfficeServiceHelper officeServiceHelper;
    private final CompanyServiceHelper companyServiceHelper;
    private final CommonUtilHelper commonUtilHelper;
    private final OfficeUtil officeUtil;

    public Office persistNewOffice(CreateOfficeInput input) {
        officeServiceHelper.validateUniqueName(input.officeName());
        officeServiceHelper.validateUniqueEmail(input.officeEmail());

        Company company = companyServiceHelper.getCompanyById(input.companyId());

        Long currentOfficeNumber = company.getNextOfficeNumber();
        String generatedOfficeCode = String.format("%03d", currentOfficeNumber);

        Office office = Office.builder()
                .officeName(commonUtilHelper.normalizeName(input.officeName()))
                .officeCode(generatedOfficeCode)
                .officeEmail(commonUtilHelper.normalizeName(input.officeEmail()))
                .officePhoneNumber(input.officePhoneNumber())
                .officeAddress(input.officeAddress())
                .officeStatus(CommonStatus.ACTIVE)
                .company(company)
                .build();

        company.setNextOfficeNumber(currentOfficeNumber + 1);

        return officeRepository.save(office);
    }

    public Office updateOffice(Long officeId, UpdateOfficeInput input) {
        Office office = officeRepository.findById(officeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Office with ID %d not found".formatted(officeId)));

        officeServiceHelper.validateUniqueName(input.officeName());
        officeServiceHelper.validateUniqueEmail(input.officeEmail());

        if (officeUtil.validateNotNull(input.officeName())) {
            office.setOfficeName(commonUtilHelper.normalizeName(input.officeName()));
        }
        if (officeUtil.validateNotNull(input.officeEmail())) {
            office.setOfficeEmail(commonUtilHelper.normalizeName(input.officeEmail()));
        }
        if (officeUtil.validateNotNull(input.officePhoneNumber())) {
            office.setOfficePhoneNumber(input.officePhoneNumber());
        }
        if (officeUtil.validateNotNull(input.officeAddress())) {
            office.setOfficeAddress(input.officeAddress());
        }

        return officeRepository.save(office);
    }

    public Office archiveOffice(Long officeId) {
        Office office = officeServiceHelper.getOfficeById(officeId);
        office.setOfficeStatus(CommonStatus.ARCHIVED);
        return officeRepository.save(office);
    }

    public Office activateOffice(Long officeId, Boolean active) {
        Office office = officeServiceHelper.getOfficeById(officeId);
        office.setOfficeStatus(active ? CommonStatus.ACTIVE : CommonStatus.INACTIVE);
        return officeRepository.save(office);
    }

    public Office deleteOffice(Long officeId) {
        Office office = officeServiceHelper.getOfficeById(officeId);
        office.setOfficeStatus(CommonStatus.ARCHIVED);
        office.setDeletedAt(commonUtilHelper.getCurrentDateTime());
        return officeRepository.save(office);
    }
}