import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphqlService } from './graphql.service';
import {
  CreateEmployeeInput,
  EmployeeDetail,
  EmployeeFilter,
  EmployeePageResult,
} from '../models/employee.model';
import { ActionResult } from '../models/settings.models';

const GET_EMPLOYEES = `
  query GetEmployees($filter: EmployeeFilterInput, $pageInput: PageInput) {
    getEmployees(filter: $filter, pageInput: $pageInput) {
      data { id firstName lastName jobTitle department status }
      currentPage totalPages totalElements pageSize hasNext hasPrevious
    }
  }
`;

const GET_EMPLOYEE = `
  query GetEmployee($id: ID!) {
    getEmployee(id: $id) {
      id firstName lastName workEmail status createdDate lastModifiedDate
      position    { id positionName level }
      department  { id departmentName departmentCode }
      accessLevel { id accessLevelName }
      bio         { fullName otherName gender nationality maritalStatus dateOfBirth placeOfBirth dateHired isExpert }
      contact     { phoneNumbers personalEmails }
      addresses   { id street city state zipCode country digitalAddress isCurrentAddress }
      identifications { id identificationNumber identificationType }
    }
  }
`;

const CREATE_EMPLOYEE = `
  mutation CreateEmployee($input: CreateEmployeeInput!) {
    createEmployee(input: $input) { id name }
  }
`;

const ACTIVATE_EMPLOYEE = `
  mutation ActivateEmployee($id: ID!) {
    activateEmployee(id: $id) { id name }
  }
`;

const DEACTIVATE_EMPLOYEE = `
  mutation DeactivateEmployee($id: ID!) {
    deactivateEmployee(id: $id) { id name }
  }
`;

const ARCHIVE_EMPLOYEE = `
  mutation ArchiveEmployee($id: ID!) {
    archiveEmployee(id: $id) { id name }
  }
`;

const UPDATE_EMPLOYEE = `
  mutation UpdateEmployee($id: ID!, $input: UpdateEmployeeInput!) {
    updateEmployee(id: $id, input: $input) { id name }
  }
`;

export interface UpdateEmployeeInput {
  positionId?: string | null;
  departmentId?: string | null;
  accessLevelId?: string | null;
}

const EMPTY_PAGE: EmployeePageResult = {
  data: [], currentPage: 0, totalPages: 0,
  totalElements: 0, pageSize: 12, hasNext: false, hasPrevious: false,
};

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly gql = inject(GraphqlService);

  getEmployees(filter: EmployeeFilter = {}, page = 0, size = 12): Observable<EmployeePageResult> {
    const variables: Record<string, unknown> = {
      pageInput: { page, size },
    };
    const gqlFilter: Record<string, unknown> = {};
    if (filter.search)       gqlFilter['search']       = filter.search;
    if (filter.status)       gqlFilter['status']       = filter.status;
    if (filter.departmentId) gqlFilter['departmentId'] = filter.departmentId;
    if (filter.positionId)   gqlFilter['positionId']   = filter.positionId;
    if (Object.keys(gqlFilter).length) variables['filter'] = gqlFilter;

    return this.gql
      .request<{ getEmployees: EmployeePageResult }>(GET_EMPLOYEES, variables)
      .pipe(map(r => {
        const p = r.getEmployees ?? EMPTY_PAGE;
        return { ...p, data: p.data ?? [] };
      }));
  }

  getEmployee(id: string): Observable<EmployeeDetail> {
    return this.gql
      .request<{ getEmployee: EmployeeDetail | null }>(GET_EMPLOYEE, { id })
      .pipe(map(r => {
        if (!r.getEmployee) throw new Error('Employee not found or access denied.');
        return r.getEmployee;
      }));
  }

  createEmployee(input: CreateEmployeeInput): Observable<ActionResult> {
    return this.gql
      .request<{ createEmployee: ActionResult }>(CREATE_EMPLOYEE, { input })
      .pipe(map(r => r.createEmployee));
  }

  activateEmployee(id: string): Observable<ActionResult> {
    return this.gql
      .request<{ activateEmployee: ActionResult }>(ACTIVATE_EMPLOYEE, { id })
      .pipe(map(r => r.activateEmployee));
  }

  deactivateEmployee(id: string): Observable<ActionResult> {
    return this.gql
      .request<{ deactivateEmployee: ActionResult }>(DEACTIVATE_EMPLOYEE, { id })
      .pipe(map(r => r.deactivateEmployee));
  }

  archiveEmployee(id: string): Observable<ActionResult> {
    return this.gql
      .request<{ archiveEmployee: ActionResult }>(ARCHIVE_EMPLOYEE, { id })
      .pipe(map(r => r.archiveEmployee));
  }

  updateEmployee(id: string, input: UpdateEmployeeInput): Observable<ActionResult> {
    return this.gql
      .request<{ updateEmployee: ActionResult }>(UPDATE_EMPLOYEE, { id, input })
      .pipe(map(r => r.updateEmployee));
  }
}
