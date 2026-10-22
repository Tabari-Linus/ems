package com.mrlii.ems.organization.employee.service;

import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.organization.employee.dto.*;

public interface EmployeeSelfServiceService {

    ActionResult updateMyBio(Long employeeId, EmployeeBioInput input);

    ActionResult updateMyContact(Long employeeId, EmployeeContactInput input);

    ActionResult addMyAddress(Long employeeId, EmployeeAddressInput input);

    ActionResult updateMyAddress(Long employeeId, Long addressId, EmployeeAddressInput input);

    ActionResult removeMyAddress(Long employeeId, Long addressId);

    ActionResult addMyIdentification(Long employeeId, EmployeeIdentificationInput input);

    ActionResult removeMyIdentification(Long employeeId, Long identificationId);

    EmployeeDetailResult getMyProfile(Long employeeId);
}
