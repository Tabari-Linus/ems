import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MeGQL, type MeQuery } from '../../graphql/generated';
import { Permission } from '../models/permission.model';

/** The signed-in user, as returned by the `me` query. */
export type Me = MeQuery['me'];
export type MeEmployee = NonNullable<Me['employee']>;

/**
 * Who is signed in: account, employee record, access level and effective permissions, all from
 * the GraphQL `me` query (docs/api/auth.md §6). Permissions are never read from the JWT.
 *
 * `load()` is called after sign-in, after a session restore and after a token refresh; it is
 * single-flight, so callers racing each other share one request.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly meGql = inject(MeGQL);
  private readonly _me = signal<Me | null>(null);
  private inFlight: Promise<Me> | null = null;

  /** The current user, or null when signed out or not loaded yet. */
  readonly me = this._me.asReadonly();
  readonly account = computed(() => this._me()?.account ?? null);
  readonly employee = computed<MeEmployee | null>(() => this._me()?.employee ?? null);
  readonly accessLevel = computed(() => this.employee()?.accessLevel?.accessLevelName ?? null);
  readonly permissions = computed<readonly Permission[]>(
    () => (this._me()?.permissions ?? []) as readonly Permission[],
  );
  readonly loaded = computed(() => this._me() !== null);

  /** "Ama Mensah", or the account email for accounts without an employee record. */
  readonly displayName = computed(() => {
    const employee = this.employee();
    if (employee) return `${employee.firstName} ${employee.lastName}`.trim();
    return this.account()?.email ?? '';
  });
  readonly firstName = computed(() => this.employee()?.firstName ?? null);

  hasPermission(permission: Permission): boolean {
    return this.permissions().includes(permission);
  }

  hasAnyPermission(permissions: readonly Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  hasAllPermissions(permissions: readonly Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  /** Fetches `me` from the server (never from the Apollo cache) and stores it. */
  load(): Promise<Me> {
    this.inFlight ??= firstValueFrom(this.meGql.fetch({ fetchPolicy: 'network-only' }))
      .then((result) => {
        const me = result.data?.me;
        if (!me) throw new Error('The me query returned no data.');
        this._me.set(me);
        return me;
      })
      .finally(() => (this.inFlight = null));
    return this.inFlight;
  }

  clear(): void {
    this._me.set(null);
  }
}
