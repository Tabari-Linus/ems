package com.mrlii.ems.Organization.department.helper;

import com.mrlii.ems.Organization.department.dto.CreateDepartmentInput;
import com.mrlii.ems.Organization.department.dto.UpdateDepartmentInput;
import com.mrlii.ems.Organization.department.entity.Department;
import com.mrlii.ems.Organization.department.repository.DepartmentRepository;
import com.mrlii.ems.Organization.department.util.DepartmentUtil;
import com.mrlii.ems.Organization.office.entity.Office;
import com.mrlii.ems.Organization.office.helper.OfficeServiceHelper;
import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.common.util.CommonUtilHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DepartmentPersistenceHelper {

    private final DepartmentRepository departmentRepository;
    private final DepartmentServiceHelper departmentServiceHelper;
    private final OfficeServiceHelper officeServiceHelper;
    private final CommonUtilHelper commonUtilHelper;
    private final DepartmentUtil departmentUtil;

    public Department persistNewDepartment(CreateDepartmentInput input) {
        departmentServiceHelper.validateUniqueName(input.departmentName());
        departmentServiceHelper.validateUniqueCode(input.departmentCode());
        departmentServiceHelper.validateUniqueEmail(input.departmentEmail());

        Office office = officeServiceHelper.getOfficeById(input.officeId());

        Department department = Department.builder()
                .departmentName(commonUtilHelper.normalizeName(input.departmentName()))
                .departmentCode(commonUtilHelper.normalizeName(input.departmentCode()))
                .departmentPrefix(input.departmentPrefix())
                .departmentEmail(commonUtilHelper.normalizeName(input.departmentEmail()))
                .departmentPhoneNumber(input.departmentPhoneNumber())
                .departmentAddress(input.departmentAddress())
                .departmentStatus(CommonStatus.ACTIVE)
                .office(office)
                .build();

        return departmentRepository.save(department);
    }

    public Department updateDepartment(Long departmentId, UpdateDepartmentInput input) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Department with ID %d not found".formatted(departmentId)));

        departmentServiceHelper.validateUniqueName(input.departmentName());
        departmentServiceHelper.validateUniqueCode(input.departmentCode());
        departmentServiceHelper.validateUniqueEmail(input.departmentEmail());

        if (departmentUtil.validateNotNull(input.departmentName())) {
            department.setDepartmentName(commonUtilHelper.normalizeName(input.departmentName()));
        }
        if (departmentUtil.validateNotNull(input.departmentCode())) {
            department.setDepartmentCode(commonUtilHelper.normalizeName(input.departmentCode()));
        }
        if (departmentUtil.validateNotNull(input.departmentPrefix())) {
            department.setDepartmentPrefix(input.departmentPrefix());
        }
        if (departmentUtil.validateNotNull(input.departmentEmail())) {
            department.setDepartmentEmail(commonUtilHelper.normalizeName(input.departmentEmail()));
        }
        if (departmentUtil.validateNotNull(input.departmentPhoneNumber())) {
            department.setDepartmentPhoneNumber(input.departmentPhoneNumber());
        }
        if (departmentUtil.validateNotNull(input.departmentAddress())) {
            department.setDepartmentAddress(input.departmentAddress());
        }

        return departmentRepository.save(department);
    }

    public Department archiveDepartment(Long departmentId) {
        Department department = departmentServiceHelper.getDepartmentById(departmentId);
        department.setDepartmentStatus(CommonStatus.ARCHIVED);
        return departmentRepository.save(department);
    }

    public Department activateDepartment(Long departmentId, Boolean active) {
        Department department = departmentServiceHelper.getDepartmentById(departmentId);
        department.setDepartmentStatus(active ? CommonStatus.ACTIVE : CommonStatus.INACTIVE);
        return departmentRepository.save(department);
    }

    public Department deleteDepartment(Long departmentId) {
        Department department = departmentServiceHelper.getDepartmentById(departmentId);
        department.setDepartmentStatus(CommonStatus.ARCHIVED);
        department.setDeletedAt(commonUtilHelper.getCurrentDateTime());
        return departmentRepository.save(department);
    }
}
