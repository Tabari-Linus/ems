import { Injectable, computed, signal } from '@angular/core';

/**
 * Holds the short-lived access token in memory only (never in storage). The token is opaque to
 * the app: permissions come from the `me` query (SessionStore), not from JWT claims.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly _token = signal('');

  /** Whether an access token is held. An expired one is renewed on the next 401. */
  readonly hasToken = computed(() => this._token() !== '');

  set(token: string): void {
    this._token.set(token);
  }

  get(): string {
    return this._token();
  }

  clear(): void {
    this._token.set('');
  }
}
