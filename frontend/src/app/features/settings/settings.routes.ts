import { Routes } from '@angular/router';
import { Settings } from './settings';

/** Settings with one routed pill tab per section: `/settings/companies` … `/settings/access-levels`. */
export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: Settings,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'companies' },
      {
        path: 'companies',
        title: 'Companies · Settings',
        loadComponent: () => import('./tabs/companies/companies').then((m) => m.SettingsCompanies),
      },
      {
        path: 'offices',
        title: 'Offices · Settings',
        loadComponent: () => import('./tabs/offices/offices').then((m) => m.SettingsOffices),
      },
      {
        path: 'departments',
        title: 'Departments · Settings',
        loadComponent: () =>
          import('./tabs/departments/departments').then((m) => m.SettingsDepartments),
      },
      {
        path: 'positions',
        title: 'Positions · Settings',
        loadComponent: () => import('./tabs/positions/positions').then((m) => m.SettingsPositions),
      },
      {
        path: 'access-levels',
        title: 'Access levels · Settings',
        loadComponent: () =>
          import('./tabs/access-levels/access-levels').then((m) => m.SettingsAccessLevels),
      },
    ],
  },
];
