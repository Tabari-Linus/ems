package com.mrlii.ems.organization.office.service.impl;

import com.mrlii.ems.organization.office.dto.*;
import com.mrlii.ems.organization.office.entity.Office;
import com.mrlii.ems.organization.office.helper.OfficePersistenceHelper;
import com.mrlii.ems.organization.office.helper.OfficeServiceHelper;
import com.mrlii.ems.organization.office.service.OfficeService;
import com.mrlii.ems.common.dto.GeneralFilterInput;
import com.mrlii.ems.common.Pagination.PageInput;
import com.mrlii.ems.common.Pagination.PageResult;
import com.mrlii.ems.common.Pagination.SortInput;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OfficeServiceImpl implements OfficeService {

    private final OfficePersistenceHelper officePersistenceHelper;
    private final OfficeServiceHelper officeServiceHelper;

    @Override
    @Transactional
    public OfficeResult createOffice(CreateOfficeInput input) {
        Office office = officePersistenceHelper.persistNewOffice(input);
        log.info("Office created successfully: Id {}", office.getId());
        return OfficeResult.of(office);
    }

    @Override
    @Transactional
    public OfficeResult updateOffice(Long id, UpdateOfficeInput input) {
        Office office = officePersistenceHelper.updateOffice(id, input);
        return OfficeResult.of(office);
    }

    @Override
    @Transactional
    public OfficeResult archiveOffice(Long id) {
        Office office = officePersistenceHelper.archiveOffice(id);
        return OfficeResult.of(office);
    }

    @Override
    @Transactional
    public OfficeResult activateOffice(Long id, Boolean active) {
        Office office = officePersistenceHelper.activateOffice(id, active);
        return OfficeResult.of(office);
    }

    @Override
    @Transactional
    public OfficeResult deleteOffice(Long id) {
        Office office = officePersistenceHelper.deleteOffice(id);
        return OfficeResult.of(office);
    }

    @Override
    @Transactional(readOnly = true)
    public OfficeDetailResult getOffice(Long id) {
        Office office = officeServiceHelper.getOfficeById(id);
        return OfficeDetailResult.of(office);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<OfficeListItemResult> getOffices(Long companyId, GeneralFilterInput filter, PageInput pageInput, SortInput sortInput) {
        return officeServiceHelper.getOffices(companyId, filter, pageInput, sortInput);
    }
}
