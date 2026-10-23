import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { Permission } from './core/models/permission.model';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () => import('./features/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'staff' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        canActivate: [permissionGuard([Permission.VIEW_MANAGER, Permission.VIEW_ADMIN])],
      },
      {
        path: 'staff',
        pathMatch: 'full',
        loadComponent: () => import('./features/staff/staff').then((m) => m.Staff),
      },
      {
        path: 'staff/:id',
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'my-profile',
        loadComponent: () => import('./features/my-profile/my-profile').then((m) => m.MyProfile),
        canActivate: [permissionGuard([Permission.VIEW_SELF, Permission.MANAGE_SELF])],
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
        canActivate: [permissionGuard([Permission.VIEW_ADMIN, Permission.MANAGE_ADMIN], true)],
      },
      {
        path: 'unauthorized',
        loadComponent: () =>
          import('./features/unauthorized/unauthorized').then((m) => m.Unauthorized),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
