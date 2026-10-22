import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphqlService } from './graphql.service';
import { ApiResponse, CompanyListItem, PageResult } from '../models/settings.models';

const GET_COMPANIES = `
  query {
    getCompanies {
      data { id companyName companyCode companyEmail companyPhoneNumber companyAddress companyStatus }
      currentPage totalPages totalElements
    }
  }
`;

const CREATE_COMPANY = `
  mutation CreateCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) { success message data { id companyName } }
  }
`;

const UPDATE_COMPANY = `
  mutation UpdateCompany($id: ID!, $input: UpdateCompanyInput!) {
    updateCompany(id: $id, input: $input) { success message data { id companyName } }
  }
`;

export interface CreateCompanyInput {
  companyName: string;
  companyCode: string;
  companyEmail: string;
  companyPhoneNumber?: string;
  companyAddress?: string;
}

export interface UpdateCompanyInput {
  companyName?: string;
  companyCode?: string;
  companyEmail?: string;
  companyPhoneNumber?: string;
  companyAddress?: string;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly gql = inject(GraphqlService);

  getCompanies(): Observable<PageResult<CompanyListItem>> {
    return this.gql
      .request<{ getCompanies: PageResult<CompanyListItem> }>(GET_COMPANIES)
      .pipe(map(r => r.getCompanies));
  }

  createCompany(input: CreateCompanyInput): Observable<ApiResponse<{ id: string; companyName: string }>> {
    return this.gql
      .request<{ createCompany: ApiResponse<{ id: string; companyName: string }> }>(CREATE_COMPANY, { input })
      .pipe(map(r => r.createCompany));
  }

  updateCompany(id: string, input: UpdateCompanyInput): Observable<ApiResponse<{ id: string; companyName: string }>> {
    return this.gql
      .request<{ updateCompany: ApiResponse<{ id: string; companyName: string }> }>(UPDATE_COMPANY, { id, input })
      .pipe(map(r => r.updateCompany));
  }
}
