import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphqlService } from './graphql.service';
import { ApiResponse, DepartmentListItem, PageResult } from '../models/settings.models';

const GET_DEPARTMENTS = `
  query {
    getDepartments {
      data { id departmentName departmentCode departmentEmail departmentPhoneNumber departmentAddress departmentStatus }
      currentPage totalPages totalElements
    }
  }
`;

const CREATE_DEPARTMENT = `
  mutation CreateDepartment($input: CreateDepartmentInput!) {
    createDepartment(input: $input) { success message data { id departmentName } }
  }
`;

const UPDATE_DEPARTMENT = `
  mutation UpdateDepartment($id: ID!, $input: UpdateDepartmentInput!) {
    updateDepartment(id: $id, input: $input) { success message data { id departmentName } }
  }
`;

export interface CreateDepartmentInput {
  officeId: string;
  departmentName: string;
  departmentEmail: string;
  departmentPhoneNumber?: string;
  departmentAddress?: string;
}

export interface UpdateDepartmentInput {
  departmentName?: string;
  departmentEmail?: string;
  departmentPhoneNumber?: string;
  departmentAddress?: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly gql = inject(GraphqlService);

  getDepartments(): Observable<PageResult<DepartmentListItem>> {
    return this.gql
      .request<{ getDepartments: PageResult<DepartmentListItem> }>(GET_DEPARTMENTS)
      .pipe(map((r) => r.getDepartments));
  }

  createDepartment(
    input: CreateDepartmentInput,
  ): Observable<ApiResponse<{ id: string; departmentName: string }>> {
    return this.gql
      .request<{ createDepartment: ApiResponse<{ id: string; departmentName: string }> }>(
        CREATE_DEPARTMENT,
        { input },
      )
      .pipe(map((r) => r.createDepartment));
  }

  updateDepartment(
    id: string,
    input: UpdateDepartmentInput,
  ): Observable<ApiResponse<{ id: string; departmentName: string }>> {
    return this.gql
      .request<{ updateDepartment: ApiResponse<{ id: string; departmentName: string }> }>(
        UPDATE_DEPARTMENT,
        { id, input },
      )
      .pipe(map((r) => r.updateDepartment));
  }
}
