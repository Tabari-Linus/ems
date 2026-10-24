import { inject } from '@angular/core';
import { CanMatchFn, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { Permission } from './core/models/permission.model';
import { AuthService } from './core/services/auth.service';

/** First URL segments that live inside the shell (signed-out visitors are sent to sign in). */
export const SHELL_PATHS = [
  'home',
  'people',
  'staff',
  'dashboard',
  'my-profile',
  'settings',
  'change-password',
  'unauthorized',
] as const;

/**
 * The shell matches every URL for a signed-in user (unknown ones show the 404 inside it), and
 * only the app's own paths for a signed-out visitor (whom `authGuard` sends to sign in), so an
 * unknown URL shows the standalone 404 instead of the sign-in page.
 */
export const shellMatch: CanMatchFn = (_route, segments) =>
  inject(AuthService).isAuthenticated() ||
  segments.length === 0 ||
  (SHELL_PATHS as readonly string[]).includes(segments[0].path);

const notFound = () => import('./features/not-found/not-found').then((m) => m.NotFound);

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · EMS',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'set-password',
    title: 'Set your password · EMS',
    loadComponent: () =>
      import('./features/auth/set-password/set-password').then((m) => m.SetPassword),
  },
  {
    path: '',
    loadComponent: () => import('./features/shell/shell').then((m) => m.Shell),
    canMatch: [shellMatch],
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        title: 'Home · EMS',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'people',
        pathMatch: 'full',
        title: 'People · EMS',
        loadComponent: () => import('./features/staff/staff').then((m) => m.Staff),
      },
      {
        path: 'people/:id',
        title: 'Profile · EMS',
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
      },
      // Old links.
      { path: 'staff', pathMatch: 'full', redirectTo: 'people' },
      { path: 'staff/:id', redirectTo: 'people/:id' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'my-profile',
        title: 'My profile · EMS',
        loadComponent: () => import('./features/my-profile/my-profile').then((m) => m.MyProfile),
        canActivate: [permissionGuard([Permission.VIEW_SELF, Permission.MANAGE_SELF])],
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
        canActivate: [permissionGuard([Permission.VIEW_ADMIN, Permission.MANAGE_ADMIN], true)],
      },
      {
        path: 'change-password',
        title: 'Change password · EMS',
        loadComponent: () =>
          import('./features/auth/change-password/change-password').then((m) => m.ChangePassword),
      },
      {
        path: 'unauthorized',
        title: 'No access · EMS',
        loadComponent: () =>
          import('./features/unauthorized/unauthorized').then((m) => m.Unauthorized),
      },
      { path: '**', title: 'Page not found · EMS', loadComponent: notFound },
    ],
  },
  { path: '**', title: 'Page not found · EMS', loadComponent: notFound },
];
