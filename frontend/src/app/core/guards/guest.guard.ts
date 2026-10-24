import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, HOME_URL } from '../services/auth.service';

/** Sign-in page only for signed-out users; signed-in users go Home. */
export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).isAuthenticated() || inject(Router).parseUrl(HOME_URL);
