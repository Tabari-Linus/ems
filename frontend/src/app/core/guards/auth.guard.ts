import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Signed-in routes. Signed-out users go to sign in and come back afterwards (`returnUrl`). */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isAuthenticated()) return true;
  const router = inject(Router);
  return state.url && state.url !== '/'
    ? router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
    : router.parseUrl('/login');
};
