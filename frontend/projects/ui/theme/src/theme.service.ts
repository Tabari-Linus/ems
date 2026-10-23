import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

/** The user's choice. `system` follows `prefers-color-scheme`. */
export type ThemePreference = 'light' | 'dark' | 'system';
/** The theme actually in effect. */
export type ResolvedTheme = 'light' | 'dark';

/** localStorage key shared with the inline no-flash snippet (see THEME_NO_FLASH_SCRIPT). */
export const THEME_STORAGE_KEY = 'ems-theme';
/** Attribute set on `<html>`; tokens.css switches semantic tokens on it. */
export const THEME_ATTRIBUTE = 'data-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Light/dark theme state.
 *
 * - `light` / `dark` set `data-theme` on `<html>`; `system` removes it so the
 *   `prefers-color-scheme` media query in tokens.css decides (no JS needed at first paint).
 * - The choice is persisted in localStorage; storage failures (private mode, blocked
 *   cookies, SSR) are ignored and the service falls back to `system`.
 * - `resolved` tracks the OS setting live while the preference is `system`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.(DARK_QUERY) ?? null;
  private readonly systemDark = signal(this.media?.matches ?? false);
  private readonly preference = signal<ThemePreference>(this.readStoredPreference());

  /** Current preference: `light`, `dark` or `system`. */
  readonly theme = this.preference.asReadonly();
  /** Theme in effect after resolving `system` against the OS setting. */
  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this.preference();
    if (preference !== 'system') return preference;
    return this.systemDark() ? 'dark' : 'light';
  });

  constructor() {
    const media = this.media;
    if (media) {
      const onChange = (event: MediaQueryListEvent): void => this.systemDark.set(event.matches);
      media.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', onChange));
    }
    this.applyToDocument(this.preference());
  }

  /** Changes and persists the preference, and updates `<html data-theme>`. */
  setTheme(preference: ThemePreference): void {
    this.preference.set(preference);
    this.applyToDocument(preference);
    this.persist(preference);
  }

  private applyToDocument(preference: ThemePreference): void {
    const root = this.document.documentElement;
    if (preference === 'system') {
      root.removeAttribute(THEME_ATTRIBUTE);
    } else {
      root.setAttribute(THEME_ATTRIBUTE, preference);
    }
  }

  private readStoredPreference(): ThemePreference {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      return isPreference(stored) ? stored : 'system';
    } catch {
      return 'system';
    }
  }

  private persist(preference: ThemePreference): void {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (preference === 'system') {
        storage?.removeItem(THEME_STORAGE_KEY);
      } else {
        storage?.setItem(THEME_STORAGE_KEY, preference);
      }
    } catch {
      // Storage unavailable: the choice still applies for this page view.
    }
  }
}
