import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/permission.model';

export function permissionGuard(permissions: Permission[], requireAll = false): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) return router.parseUrl('/login');

    const hasAccess = requireAll
      ? authService.hasAllPermissions(permissions)
      : authService.hasAnyPermission(permissions);

    return hasAccess || router.parseUrl('/unauthorized');
  };
}
