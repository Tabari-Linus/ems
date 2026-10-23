export interface PageResult<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ActionResult {
  id: string;
  name?: string;
}

export interface CompanyListItem {
  id: string;
  companyName: string;
  companyCode: string;
  companyEmail?: string;
  companyPhoneNumber?: string;
  companyAddress?: string;
  companyStatus?: string;
}

export interface OfficeListItem {
  id: string;
  officeName: string;
  officeCode: string;
  officeEmail?: string;
  officePhoneNumber?: string;
  officeAddress?: string;
  officeStatus?: string;
}

export interface DepartmentListItem {
  id: string;
  departmentName: string;
  departmentCode: string;
  departmentEmail?: string;
  departmentPhoneNumber?: string;
  departmentAddress?: string;
  departmentStatus?: string;
}

export type PositionLevel = 'INTERN' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL' | 'STAFF';

export interface PositionListItem {
  id: string;
  positionName: string;
  level: PositionLevel;
  description?: string;
  status: string;
}

export interface AccessLevelListItem {
  id: string;
  accessLevelName: string;
  description?: string;
  status: string;
}
