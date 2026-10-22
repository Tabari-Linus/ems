import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphqlService } from './graphql.service';
import { ApiResponse, OfficeListItem, PageResult } from '../models/settings.models';

const GET_OFFICES = `
  query {
    getOffices {
      data { id officeName officeCode officeEmail officePhoneNumber officeAddress officeStatus }
      currentPage totalPages totalElements
    }
  }
`;

const CREATE_OFFICE = `
  mutation CreateOffice($input: CreateOfficeInput!) {
    createOffice(input: $input) { success message data { id officeName } }
  }
`;

const UPDATE_OFFICE = `
  mutation UpdateOffice($id: ID!, $input: UpdateOfficeInput!) {
    updateOffice(id: $id, input: $input) { success message data { id officeName } }
  }
`;

export interface CreateOfficeInput {
  companyId: string;
  officeName: string;
  officeEmail: string;
  officePhoneNumber?: string;
  officeAddress?: string;
}

export interface UpdateOfficeInput {
  officeName?: string;
  officeEmail?: string;
  officePhoneNumber?: string;
  officeAddress?: string;
}

@Injectable({ providedIn: 'root' })
export class OfficeService {
  private readonly gql = inject(GraphqlService);

  getOffices(): Observable<PageResult<OfficeListItem>> {
    return this.gql
      .request<{ getOffices: PageResult<OfficeListItem> }>(GET_OFFICES)
      .pipe(map(r => r.getOffices));
  }

  createOffice(input: CreateOfficeInput): Observable<ApiResponse<{ id: string; officeName: string }>> {
    return this.gql
      .request<{ createOffice: ApiResponse<{ id: string; officeName: string }> }>(CREATE_OFFICE, { input })
      .pipe(map(r => r.createOffice));
  }

  updateOffice(id: string, input: UpdateOfficeInput): Observable<ApiResponse<{ id: string; officeName: string }>> {
    return this.gql
      .request<{ updateOffice: ApiResponse<{ id: string; officeName: string }> }>(UPDATE_OFFICE, { id, input })
      .pipe(map(r => r.updateOffice));
  }
}
