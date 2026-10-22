import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GraphqlService } from './graphql.service';
import { ActionResult } from '../models/settings.models';
import { EmployeeDetail } from '../models/employee.model';

// ── Queries ───────────────────────────────────────────────────────────

const GET_MY_PROFILE = `
  query GetMyProfile {
    getMyProfile {
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

// ── Mutations ─────────────────────────────────────────────────────────

const UPDATE_MY_BIO = `
  mutation UpdateMyBio($input: EmployeeBioInput!) {
    updateMyBio(input: $input) { id name }
  }
`;

const UPDATE_MY_CONTACT = `
  mutation UpdateMyContact($input: EmployeeContactInput!) {
    updateMyContact(input: $input) { id name }
  }
`;

const ADD_MY_ADDRESS = `
  mutation AddMyAddress($input: EmployeeAddressInput!) {
    addMyAddress(input: $input) { id name }
  }
`;

const UPDATE_MY_ADDRESS = `
  mutation UpdateMyAddress($addressId: ID!, $input: EmployeeAddressInput!) {
    updateMyAddress(addressId: $addressId, input: $input) { id name }
  }
`;

const REMOVE_MY_ADDRESS = `
  mutation RemoveMyAddress($addressId: ID!) {
    removeMyAddress(addressId: $addressId) { id name }
  }
`;

const ADD_MY_IDENTIFICATION = `
  mutation AddMyIdentification($input: EmployeeIdentificationInput!) {
    addMyIdentification(input: $input) { id name }
  }
`;

const REMOVE_MY_IDENTIFICATION = `
  mutation RemoveMyIdentification($identificationId: ID!) {
    removeMyIdentification(identificationId: $identificationId) { id name }
  }
`;

// ── Input types ───────────────────────────────────────────────────────

export interface EmployeeBioInput {
  fullName?: string;
  otherName?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  dateHired?: string;
  isExpert?: string;
}

export interface EmployeeContactInput {
  phoneNumbers?: string[];
  personalEmails?: string[];
}

export interface EmployeeAddressInput {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  digitalAddress?: string;
  isCurrentAddress?: boolean;
}

export interface EmployeeIdentificationInput {
  identificationNumber: string;
  identificationType: string;
}

// ── Service ───────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class EmployeeSelfService {
  private readonly gql = inject(GraphqlService);

  getMyProfile(): Observable<EmployeeDetail | null> {
    return this.gql
      .request<{ getMyProfile: EmployeeDetail | null }>(GET_MY_PROFILE)
      .pipe(map((r) => r.getMyProfile ?? null));
  }

  updateMyBio(input: EmployeeBioInput): Observable<ActionResult> {
    return this.gql
      .request<{ updateMyBio: ActionResult }>(UPDATE_MY_BIO, { input })
      .pipe(map((r) => r.updateMyBio));
  }

  updateMyContact(input: EmployeeContactInput): Observable<ActionResult> {
    return this.gql
      .request<{ updateMyContact: ActionResult }>(UPDATE_MY_CONTACT, { input })
      .pipe(map((r) => r.updateMyContact));
  }

  addMyAddress(input: EmployeeAddressInput): Observable<ActionResult> {
    return this.gql
      .request<{ addMyAddress: ActionResult }>(ADD_MY_ADDRESS, { input })
      .pipe(map((r) => r.addMyAddress));
  }

  updateMyAddress(addressId: string, input: EmployeeAddressInput): Observable<ActionResult> {
    return this.gql
      .request<{ updateMyAddress: ActionResult }>(UPDATE_MY_ADDRESS, { addressId, input })
      .pipe(map((r) => r.updateMyAddress));
  }

  removeMyAddress(addressId: string): Observable<ActionResult> {
    return this.gql
      .request<{ removeMyAddress: ActionResult }>(REMOVE_MY_ADDRESS, { addressId })
      .pipe(map((r) => r.removeMyAddress));
  }

  addMyIdentification(input: EmployeeIdentificationInput): Observable<ActionResult> {
    return this.gql
      .request<{ addMyIdentification: ActionResult }>(ADD_MY_IDENTIFICATION, { input })
      .pipe(map((r) => r.addMyIdentification));
  }

  removeMyIdentification(identificationId: string): Observable<ActionResult> {
    return this.gql
      .request<{ removeMyIdentification: ActionResult }>(REMOVE_MY_IDENTIFICATION, {
        identificationId,
      })
      .pipe(map((r) => r.removeMyIdentification));
  }
}
