import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { shellMatch } from '../../app.routes';
import { Permission } from '../models/permission.model';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { permissionGuard } from './permission.guard';

describe('route guards', () => {
  let signedIn: boolean;
  let permissions: Permission[];

  beforeEach(() => {
    signedIn = false;
    permissions = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => signedIn,
            hasAnyPermission: (p: Permission[]) => p.some((x) => permissions.includes(x)),
            hasAllPermissions: (p: Permission[]) => p.every((x) => permissions.includes(x)),
          },
        },
      ],
    });
  });

  const route = {} as ActivatedRouteSnapshot;
  const state = (url: string) => ({ url }) as RouterStateSnapshot;
  const run = <T>(fn: () => T) => TestBed.runInInjectionContext(fn);
  const serialize = (result: unknown) =>
    result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;

  describe('authGuard', () => {
    it('lets signed-in users through', () => {
      signedIn = true;
      expect(run(() => authGuard(route, state('/home')))).toBe(true);
    });

    it('sends signed-out users to sign in, remembering where they were going', () => {
      expect(serialize(run(() => authGuard(route, state('/people/3'))))).toBe(
        '/login?returnUrl=%2Fpeople%2F3',
      );
    });

    it('does not add a returnUrl for the root', () => {
      expect(serialize(run(() => authGuard(route, state('/'))))).toBe('/login');
    });
  });

  describe('guestGuard', () => {
    it('shows sign-in to signed-out users', () => {
      expect(run(() => guestGuard(route, state('/login')))).toBe(true);
    });

    it('sends signed-in users Home', () => {
      signedIn = true;
      expect(serialize(run(() => guestGuard(route, state('/login'))))).toBe('/home');
    });
  });

  describe('permissionGuard', () => {
    const anyOf = permissionGuard([Permission.VIEW_SELF, Permission.MANAGE_SELF]);
    const allOf = permissionGuard([Permission.VIEW_ADMIN, Permission.MANAGE_ADMIN], true);

    it('sends signed-out users to sign in', () => {
      expect(serialize(run(() => anyOf(route, state('/my-profile'))))).toBe('/login');
    });

    it('allows any of the permissions from me', () => {
      signedIn = true;
      permissions = [Permission.MANAGE_SELF];
      expect(run(() => anyOf(route, state('/my-profile')))).toBe(true);
    });

    it('requires all when asked to', () => {
      signedIn = true;
      permissions = [Permission.VIEW_ADMIN];
      expect(serialize(run(() => allOf(route, state('/settings'))))).toBe('/unauthorized');
      permissions = [Permission.VIEW_ADMIN, Permission.MANAGE_ADMIN];
      expect(run(() => allOf(route, state('/settings')))).toBe(true);
    });
  });

  describe('shellMatch', () => {
    const segments = (path: string) =>
      path
        .split('/')
        .filter(Boolean)
        .map((p) => new UrlSegment(p, {}));

    it('matches every URL when signed in (unknown ones get the in-shell 404)', () => {
      signedIn = true;
      expect(run(() => shellMatch({}, segments('/nope')))).toBe(true);
    });

    it('matches only app paths when signed out, so unknown URLs get the standalone 404', () => {
      expect(run(() => shellMatch({}, segments('')))).toBe(true);
      expect(run(() => shellMatch({}, segments('/people/3')))).toBe(true);
      expect(run(() => shellMatch({}, segments('/staff')))).toBe(true);
      expect(run(() => shellMatch({}, segments('/nope')))).toBe(false);
    });
  });
});
