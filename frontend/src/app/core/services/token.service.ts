import { Injectable, computed, signal } from '@angular/core';

interface JwtPayload {
  sub: string;
  permissions: string[];
  account_id: number;
  exp: number;
  iss: string;
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly _token = signal('');

  readonly permissions = computed<string[]>(() => {
    const token = this._token();
    if (!token) return [];
    try {
      return this.decode(token).permissions ?? [];
    } catch {
      return [];
    }
  });

  readonly isValid = computed(() => {
    const token = this._token();
    if (!token) return false;
    try {
      return this.decode(token).exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });

  set(token: string): void {
    this._token.set(token);
  }

  get(): string {
    return this._token();
  }

  clear(): void {
    this._token.set('');
  }

  private decode(token: string): JwtPayload {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as JwtPayload;
  }
}
