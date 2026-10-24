import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, InjectionToken, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AuthResponse } from '../models/auth.model';
import { TokenService } from './token.service';

/**
 * Required by the backend's CSRF check on the cookie-authenticated endpoints (refresh, logout,
 * logout-all). See docs/api/auth.md §3.
 */
export const CSRF_HEADERS = { 'X-Requested-With': 'ems-web' } as const;

/** Name of the Web Locks API lock and of the BroadcastChannel shared by every tab of the app. */
export const REFRESH_LOCK_NAME = 'ems-refresh';
export const AUTH_CHANNEL_NAME = 'ems-auth';

/** Messages exchanged between tabs on {@link AUTH_CHANNEL_NAME}. */
export type AuthChannelMessage =
  { type: 'refreshed'; accessToken: string } | { type: 'signed-out' };

/** The subset of `navigator.locks` used here; null where the Web Locks API is missing. */
export interface LockManagerLike {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

export const LOCK_MANAGER = new InjectionToken<LockManagerLike | null>('LOCK_MANAGER', {
  providedIn: 'root',
  factory: () =>
    typeof navigator !== 'undefined' && 'locks' in navigator
      ? (navigator.locks as unknown as LockManagerLike)
      : null,
});

/** Opens the cross-tab channel; null where BroadcastChannel is missing. */
export const AUTH_CHANNEL_FACTORY = new InjectionToken<() => BroadcastChannel | null>(
  'AUTH_CHANNEL_FACTORY',
  {
    providedIn: 'root',
    factory: () => () =>
      typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(AUTH_CHANNEL_NAME),
  },
);

/**
 * Exchanges the refresh cookie for a new access token, safely.
 *
 * The refresh token is single use and the server revokes the whole session when a used one is
 * presented again (reuse detection, docs/api/auth.md §5). So:
 * - **single-flight per tab**: every caller that hits a 401 while a refresh is running shares it;
 * - **one tab at a time**: the call runs inside a Web Locks API lock, so two tabs never present
 *   the same cookie at once (the second tab sends the cookie the first one just received);
 * - **others pick up the result**: the new access token is broadcast to the other tabs. A tab
 *   that was waiting for the lock and has received a newer token meanwhile uses it and skips its
 *   own network call.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenService);
  private readonly locks = inject(LOCK_MANAGER);
  private readonly url = `${inject(APP_CONFIG).apiUrl}/api/v1/auth/refresh-token`;
  private readonly channel = inject(AUTH_CHANNEL_FACTORY)();
  private readonly signedOutListeners = new Set<() => void>();
  private inFlight: Promise<string> | null = null;

  constructor() {
    const channel = this.channel;
    if (!channel) return;
    channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => this.onMessage(event.data);
    inject(DestroyRef).onDestroy(() => channel.close());
  }

  /** Resolves with a fresh access token; rejects when the session cannot be renewed. */
  refresh(): Promise<string> {
    if (!this.inFlight) {
      const failedToken = this.tokens.get();
      const run = () => this.refreshUnlessDoneElsewhere(failedToken);
      this.inFlight = (this.locks ? this.locks.request(REFRESH_LOCK_NAME, run) : run()).finally(
        () => (this.inFlight = null),
      );
    }
    return this.inFlight;
  }

  /** Tells the other tabs this session has ended. */
  broadcastSignedOut(): void {
    this.post({ type: 'signed-out' });
  }

  /** Runs `listener` when another tab signs out. Returns an unsubscribe function. */
  onSignedOutElsewhere(listener: () => void): () => void {
    this.signedOutListeners.add(listener);
    return () => this.signedOutListeners.delete(listener);
  }

  private async refreshUnlessDoneElsewhere(failedToken: string): Promise<string> {
    const current = this.tokens.get();
    if (current && current !== failedToken) {
      // Another tab refreshed while this one waited for the lock: use its token.
      return current;
    }
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(this.url, null, {
        withCredentials: true,
        headers: CSRF_HEADERS,
      }),
    );
    this.tokens.set(response.accessToken);
    this.post({ type: 'refreshed', accessToken: response.accessToken });
    return response.accessToken;
  }

  private onMessage(message: AuthChannelMessage | null | undefined): void {
    if (message?.type === 'refreshed' && typeof message.accessToken === 'string') {
      // Only adopt it while signed in here: a signed-out tab stays signed out.
      if (this.tokens.get()) this.tokens.set(message.accessToken);
    } else if (message?.type === 'signed-out') {
      for (const listener of this.signedOutListeners) listener();
    }
  }

  private post(message: AuthChannelMessage): void {
    try {
      this.channel?.postMessage(message);
    } catch {
      // A closed channel only loses the cross-tab optimisation.
    }
  }
}
