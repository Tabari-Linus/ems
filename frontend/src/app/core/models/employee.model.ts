// ── List types ───────────────────────────────────────────────────

export interface EmployeeListItem {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  status?: string;
}

export interface EmployeePageResult {
  data: EmployeeListItem[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface EmployeeFilter {
  search?: string;
  status?: string;
  departmentId?: string;
  positionId?: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  workEmail: string;
  positionId?: string;
  departmentId?: string;
  accessLevelId?: string;
}

// ── Detail types ─────────────────────────────────────────────────

export interface EmployeeBio {
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

export interface EmployeeContact {
  phoneNumbers?: string[];
  personalEmails?: string[];
}

export interface EmployeeAddress {
  id: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  digitalAddress?: string;
  isCurrentAddress?: boolean;
}

export interface EmployeeIdentification {
  id: string;
  identificationNumber: string;
  identificationType: string;
}

export interface EmployeeDetail {
  id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  status: string;
  createdDate: string;
  lastModifiedDate?: string;
  position?: {
    id: string;
    positionName: string;
    level: string;
  };
  department?: {
    id: string;
    departmentName: string;
    departmentCode: string;
  };
  accessLevel?: {
    id: string;
    accessLevelName: string;
  };
  bio?: EmployeeBio;
  contact?: EmployeeContact;
  addresses: EmployeeAddress[];
  identifications: EmployeeIdentification[];
}
