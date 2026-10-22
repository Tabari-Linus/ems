package com.mrlii.ems.organization.employee.service.impl;

import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.organization.employee.dto.*;
import com.mrlii.ems.organization.employee.entity.Employee;
import com.mrlii.ems.organization.employee.entity.EmployeeAddress;
import com.mrlii.ems.organization.employee.entity.EmployeeIdentification;
import com.mrlii.ems.organization.employee.helper.EmployeeSelfServiceHelper;
import com.mrlii.ems.organization.employee.helper.EmployeeServiceHelper;
import com.mrlii.ems.organization.employee.service.EmployeeSelfServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmployeeSelfServiceServiceImpl implements EmployeeSelfServiceService {

    private final EmployeeSelfServiceHelper selfServiceHelper;
    private final EmployeeServiceHelper serviceHelper;

    @Override
    public ActionResult updateMyBio(Long employeeId, EmployeeBioInput input) {
        Employee employee = selfServiceHelper.updateMyBio(employeeId, input);
        return new ActionResult(employee.getId(), employee.getFirstName() + " " + employee.getLastName());
    }

    @Override
    public ActionResult updateMyContact(Long employeeId, EmployeeContactInput input) {
        Employee employee = selfServiceHelper.updateMyContact(employeeId, input);
        return new ActionResult(employee.getId(), employee.getFirstName() + " " + employee.getLastName());
    }

    @Override
    public ActionResult addMyAddress(Long employeeId, EmployeeAddressInput input) {
        EmployeeAddress address = selfServiceHelper.addMyAddress(employeeId, input);
        return new ActionResult(address.getId(), buildAddressLabel(address));
    }

    @Override
    public ActionResult updateMyAddress(Long employeeId, Long addressId, EmployeeAddressInput input) {
        EmployeeAddress address = selfServiceHelper.updateMyAddress(employeeId, addressId, input);
        return new ActionResult(address.getId(), buildAddressLabel(address));
    }

    @Override
    public ActionResult removeMyAddress(Long employeeId, Long addressId) {
        selfServiceHelper.removeMyAddress(employeeId, addressId);
        return new ActionResult(addressId, "Removed");
    }

    @Override
    public ActionResult addMyIdentification(Long employeeId, EmployeeIdentificationInput input) {
        EmployeeIdentification identification = selfServiceHelper.addMyIdentification(employeeId, input);
        return new ActionResult(identification.getId(), identification.getIdentificationNumber());
    }

    @Override
    public ActionResult removeMyIdentification(Long employeeId, Long identificationId) {
        selfServiceHelper.removeMyIdentification(employeeId, identificationId);
        return new ActionResult(identificationId, "Removed");
    }

    @Override
    public EmployeeDetailResult getMyProfile(Long employeeId) {
        return serviceHelper.getEmployeeDetail(employeeId);
    }

    private String buildAddressLabel(EmployeeAddress address) {
        String city = address.getCity() != null ? address.getCity() : "";
        String country = address.getCountry() != null ? address.getCountry() : "";
        return city.isBlank() ? country : getCity(country, city);
    }

    private static String getCity(String country, String city) {
        return country.isBlank() ? city : city + ", " + country;
    }
}
