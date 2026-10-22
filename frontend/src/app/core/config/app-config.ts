import { InjectionToken, Provider } from '@angular/core';

/**
 * Deployment-specific settings, loaded at runtime from `/config.json` so the same
 * build can be promoted between environments. Never put secrets here: the file is public.
 */
export interface AppConfig {
  /** Origin of the backend API, without a trailing slash, e.g. `https://api.example.com`. */
  readonly apiUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export class AppConfigError extends Error {
  override readonly name = 'AppConfigError';
}

/** Default location of the runtime config, resolved against the document base URI. */
export const APP_CONFIG_PATH = 'config.json';

/** Validates an untrusted value (parsed `config.json`) and returns a normalised `AppConfig`. */
export function parseAppConfig(raw: unknown): AppConfig {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new AppConfigError('config.json must contain a JSON object.');
  }
  const apiUrl: unknown = (raw as Record<string, unknown>)['apiUrl'];
  if (typeof apiUrl !== 'string' || apiUrl.trim() === '') {
    throw new AppConfigError('config.json is missing the required string property "apiUrl".');
  }
  let url: URL;
  try {
    url = new URL(apiUrl.trim());
  } catch {
    throw new AppConfigError(`config.json "apiUrl" is not an absolute URL: "${apiUrl}".`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AppConfigError(`config.json "apiUrl" must use http or https: "${apiUrl}".`);
  }
  return { apiUrl: url.href.replace(/\/+$/, '') };
}

/**
 * Fetches and validates the runtime config. Called from `main.ts` before bootstrap, so
 * every provider (HttpClient services, Apollo) can read `APP_CONFIG` synchronously.
 */
export async function loadAppConfig(
  fetchFn: typeof fetch = (input, init) => fetch(input, init),
  url: string = new URL(APP_CONFIG_PATH, document.baseURI).href,
): Promise<AppConfig> {
  let response: Response;
  try {
    response = await fetchFn(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  } catch (cause) {
    throw new AppConfigError(`Could not fetch runtime config from ${url}.`, { cause });
  }
  if (!response.ok) {
    throw new AppConfigError(`Could not load runtime config from ${url}: HTTP ${response.status}.`);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new AppConfigError(`Runtime config at ${url} is not valid JSON.`, { cause });
  }
  return parseAppConfig(body);
}

export function provideAppConfig(config: AppConfig): Provider {
  return { provide: APP_CONFIG, useValue: config };
}
