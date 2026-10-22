import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphqlService } from './graphql.service';
import { AccessLevelListItem, ActionResult, PageResult } from '../models/settings.models';

const GET_ACCESS_LEVELS = `
  query {
    getAccessLevels {
      data { id accessLevelName description status }
      currentPage totalPages totalElements
    }
  }
`;

const GET_ACCESS_LEVEL = `
  query GetAccessLevel($id: ID!) {
    getAccessLevel(id: $id) {
      id accessLevelName description status permissions
      employees { id firstName lastName status }
    }
  }
`;

const CREATE_ACCESS_LEVEL = `
  mutation CreateAccessLevel($input: CreateAccessLevelInput!) {
    createAccessLevel(input: $input) { id name }
  }
`;

const UPDATE_ACCESS_LEVEL = `
  mutation UpdateAccessLevel($id: ID!, $input: UpdateAccessLevelInput!) {
    updateAccessLevel(id: $id, input: $input) { id name }
  }
`;

export interface CreateAccessLevelInput {
  accessLevelName: string;
  description?: string;
  permissions: string[];
  employeeIds?: string[];
}

export interface UpdateAccessLevelInput {
  accessLevelName?: string;
  description?: string;
  addEmployeeIds?: string[];
  removeEmployeeIds?: string[];
}

export interface AccessLevelEmployee {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
}

export interface AccessLevelDetail {
  id: string;
  accessLevelName: string;
  description?: string;
  status: string;
  permissions: string[];
  employees?: AccessLevelEmployee[];
}

@Injectable({ providedIn: 'root' })
export class AccessLevelService {
  private readonly gql = inject(GraphqlService);

  getAccessLevels(): Observable<PageResult<AccessLevelListItem>> {
    return this.gql
      .request<{ getAccessLevels: PageResult<AccessLevelListItem> }>(GET_ACCESS_LEVELS)
      .pipe(map(r => r.getAccessLevels));
  }

  getAccessLevel(id: string): Observable<AccessLevelDetail | null> {
    return this.gql
      .request<{ getAccessLevel: AccessLevelDetail | null }>(GET_ACCESS_LEVEL, { id })
      .pipe(map(r => r.getAccessLevel ?? null));
  }

  createAccessLevel(input: CreateAccessLevelInput): Observable<ActionResult> {
    return this.gql
      .request<{ createAccessLevel: ActionResult }>(CREATE_ACCESS_LEVEL, { input })
      .pipe(map(r => r.createAccessLevel));
  }

  updateAccessLevel(id: string, input: UpdateAccessLevelInput): Observable<ActionResult> {
    return this.gql
      .request<{ updateAccessLevel: ActionResult }>(UPDATE_ACCESS_LEVEL, { id, input })
      .pipe(map(r => r.updateAccessLevel));
  }
}
