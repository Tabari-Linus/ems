package com.mrlii.ems.organization.employee.controller;

import com.mrlii.ems.common.dto.ActionResult;
import com.mrlii.ems.organization.employee.dto.*;
import com.mrlii.ems.organization.employee.service.EmployeeSelfServiceService;
import com.mrlii.ems.organization.employee.util.EmployeeSecurityHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class EmployeeSelfServiceController {

    private final EmployeeSelfServiceService selfServiceService;
    private final EmployeeSecurityHelper securityHelper;

    // @PreAuthorize("hasAuthority('MANAGE_ROLE')")
    @MutationMapping
    public ActionResult updateMyBio(@Argument @Valid EmployeeBioInput input) {
        return selfServiceService.updateMyBio(securityHelper.getCurrentEmployeeId(), input);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ROLE')")
    @MutationMapping
    public ActionResult updateMyContact(@Argument @Valid EmployeeContactInput input) {
        return selfServiceService.updateMyContact(securityHelper.getCurrentEmployeeId(), input);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ROLE')")
    @MutationMapping
    public ActionResult addMyAddress(@Argument @Valid EmployeeAddressInput input) {
        return selfServiceService.addMyAddress(securityHelper.getCurrentEmployeeId(), input);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ROLE')")
    @MutationMapping
    public ActionResult updateMyAddress(@Argument Long addressId, @Argument @Valid EmployeeAddressInput input) {
        return selfServiceService.updateMyAddress(securityHelper.getCurrentEmployeeId(), addressId, input);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ROLE')")
    @MutationMapping
    public ActionResult removeMyAddress(@Argument Long addressId) {
        return selfServiceService.removeMyAddress(securityHelper.getCurrentEmployeeId(), addressId);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ROLE')")
    @MutationMapping
    public ActionResult addMyIdentification(@Argument @Valid EmployeeIdentificationInput input) {
        return selfServiceService.addMyIdentification(securityHelper.getCurrentEmployeeId(), input);
    }

    // @PreAuthorize("hasAuthority('MANAGE_ROLE')")
    @MutationMapping
    public ActionResult removeMyIdentification(@Argument Long identificationId) {
        return selfServiceService.removeMyIdentification(securityHelper.getCurrentEmployeeId(), identificationId);
    }

    // @PreAuthorize("hasAuthority('VIEW_ROLE')")
    @QueryMapping
    public EmployeeDetailResult getMyProfile() {
        return selfServiceService.getMyProfile(securityHelper.getCurrentEmployeeId());
    }
}
