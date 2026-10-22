import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphqlService } from './graphql.service';
import { ActionResult, PageResult, PositionLevel, PositionListItem } from '../models/settings.models';

const GET_POSITIONS = `
  query {
    getPositions {
      data { id positionName level description status }
      currentPage totalPages totalElements
    }
  }
`;

const CREATE_POSITION = `
  mutation CreatePosition($input: CreatePositionInput!) {
    createPosition(input: $input) { id name }
  }
`;

const UPDATE_POSITION = `
  mutation UpdatePosition($id: ID!, $input: UpdatePositionInput!) {
    updatePosition(id: $id, input: $input) { id name }
  }
`;

export interface CreatePositionInput {
  positionName: string;
  level: PositionLevel;
  description?: string;
}

export interface UpdatePositionInput {
  positionName?: string;
  level?: PositionLevel;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class PositionService {
  private readonly gql = inject(GraphqlService);

  getPositions(): Observable<PageResult<PositionListItem>> {
    return this.gql
      .request<{ getPositions: PageResult<PositionListItem> }>(GET_POSITIONS)
      .pipe(map(r => r.getPositions));
  }

  createPosition(input: CreatePositionInput): Observable<ActionResult> {
    return this.gql
      .request<{ createPosition: ActionResult }>(CREATE_POSITION, { input })
      .pipe(map(r => r.createPosition));
  }

  updatePosition(id: string, input: UpdatePositionInput): Observable<ActionResult> {
    return this.gql
      .request<{ updatePosition: ActionResult }>(UPDATE_POSITION, { id, input })
      .pipe(map(r => r.updatePosition));
  }
}
