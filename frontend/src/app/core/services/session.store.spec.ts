import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { MeGQL, type MeQuery } from '../../graphql/generated';
import { Permission } from '../models/permission.model';
import { ME_FIXTURE } from '../../testing/session';
import { SessionStore } from './session.store';

describe('SessionStore', () => {
  let fetch: ReturnType<typeof vi.fn>;
  let store: SessionStore;

  beforeEach(() => {
    fetch = vi.fn(() => of({ data: { me: ME_FIXTURE } }));
    TestBed.configureTestingModule({ providers: [{ provide: MeGQL, useValue: { fetch } }] });
    store = TestBed.inject(SessionStore);
  });

  it('starts empty', () => {
    expect(store.loaded()).toBe(false);
    expect(store.permissions()).toEqual([]);
    expect(store.displayName()).toBe('');
    expect(store.hasPermission(Permission.VIEW_SELF)).toBe(false);
  });

  it('loads me from the network and exposes account, employee, access level and permissions', async () => {
    await expect(store.load()).resolves.toEqual(ME_FIXTURE);

    expect(fetch).toHaveBeenCalledWith({ fetchPolicy: 'network-only' });
    expect(store.loaded()).toBe(true);
    expect(store.account()?.email).toBe('ama.mensah@akwaabalabs.example');
    expect(store.employee()?.id).toBe('e-1');
    expect(store.accessLevel()).toBe('HR admin');
    expect(store.displayName()).toBe('Ama Mensah');
    expect(store.firstName()).toBe('Ama');
    expect(store.permissions()).toEqual(['VIEW_SELF', 'VIEW_EMPLOYEE']);
  });

  it('answers permission checks from me', async () => {
    await store.load();
    expect(store.hasPermission(Permission.VIEW_SELF)).toBe(true);
    expect(store.hasPermission(Permission.MANAGE_ADMIN)).toBe(false);
    expect(store.hasAnyPermission([Permission.MANAGE_ADMIN, Permission.VIEW_EMPLOYEE])).toBe(true);
    expect(store.hasAllPermissions([Permission.VIEW_SELF, Permission.VIEW_EMPLOYEE])).toBe(true);
    expect(store.hasAllPermissions([Permission.VIEW_SELF, Permission.MANAGE_ADMIN])).toBe(false);
  });

  it('uses the account email when there is no employee record', async () => {
    fetch.mockReturnValue(of({ data: { me: { ...ME_FIXTURE, employee: null } } }));
    await store.load();
    expect(store.displayName()).toBe('ama.mensah@akwaabalabs.example');
    expect(store.firstName()).toBeNull();
    expect(store.accessLevel()).toBeNull();
  });

  it('is single-flight', async () => {
    const response = new Subject<{ data: { me: MeQuery['me'] } }>();
    fetch.mockReturnValue(response);
    const a = store.load();
    const b = store.load();
    expect(a).toBe(b);
    expect(fetch).toHaveBeenCalledTimes(1);
    response.next({ data: { me: ME_FIXTURE } });
    response.complete();
    await Promise.all([a, b]);

    fetch.mockReturnValue(of({ data: { me: ME_FIXTURE } }));
    await store.load();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('rejects when the query fails or returns no data, keeping the previous state', async () => {
    fetch.mockReturnValue(throwError(() => new Error('offline')));
    await expect(store.load()).rejects.toThrow('offline');
    fetch.mockReturnValue(of({ data: undefined }));
    await expect(store.load()).rejects.toThrow('no data');
    expect(store.loaded()).toBe(false);
  });

  it('clears', async () => {
    await store.load();
    store.clear();
    expect(store.loaded()).toBe(false);
    expect(store.permissions()).toEqual([]);
  });
});
