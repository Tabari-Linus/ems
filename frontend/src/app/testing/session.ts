import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MeGQL, type MeQuery } from '../graphql/generated';
import { SessionStore } from '../core/services/session.store';
import { TokenService } from '../core/services/token.service';

/** Test data for the `me` query. */
export const ME_FIXTURE: MeQuery['me'] = {
  account: { id: 'acc-1', email: 'ama.mensah@akwaabalabs.example', lastLoginAt: null },
  employee: {
    id: 'e-1',
    firstName: 'Ama',
    lastName: 'Mensah',
    workEmail: 'ama.mensah@akwaabalabs.example',
    status: 'ACTIVE',
    position: { positionName: 'Engineering Manager' },
    department: { id: 'd-1', departmentName: 'Platform Engineering' },
    accessLevel: { accessLevelName: 'HR admin' },
  },
  permissions: ['VIEW_SELF', 'VIEW_EMPLOYEE'],
};

/** `me` with the given permissions (and optional overrides). */
export function meWith(permissions: string[], overrides: Partial<MeQuery['me']> = {}) {
  return { ...ME_FIXTURE, permissions, ...overrides } as MeQuery['me'];
}

/** MeGQL answering with `me`. */
export function provideMe(me: MeQuery['me'] = ME_FIXTURE): Provider {
  return { provide: MeGQL, useValue: { fetch: () => of({ data: { me } }) } };
}

/** Puts TestBed in the signed-in state: a token held and `me` loaded. */
export async function signIn(): Promise<void> {
  TestBed.inject(TokenService).set('test-token');
  await TestBed.inject(SessionStore).load();
}
