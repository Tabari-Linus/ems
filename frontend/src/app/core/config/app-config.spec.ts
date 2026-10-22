import { TestBed } from '@angular/core/testing';
import {
  APP_CONFIG,
  AppConfigError,
  loadAppConfig,
  parseAppConfig,
  provideAppConfig,
} from './app-config';

const CONFIG_URL = 'http://app.test/config.json';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('parseAppConfig', () => {
  it('accepts a valid config and strips trailing slashes', () => {
    expect(parseAppConfig({ apiUrl: 'https://api.example.com/' })).toEqual({
      apiUrl: 'https://api.example.com',
    });
  });

  it('keeps a path prefix on the API URL', () => {
    expect(parseAppConfig({ apiUrl: 'http://localhost:8080/ems//' }).apiUrl).toBe(
      'http://localhost:8080/ems',
    );
  });

  it.each([
    ['null', null],
    ['an array', [{ apiUrl: 'https://api.example.com' }]],
    ['a string', 'https://api.example.com'],
  ])('rejects %s', (_label, raw) => {
    expect(() => parseAppConfig(raw)).toThrow(AppConfigError);
  });

  it.each([
    ['missing', {}],
    ['empty', { apiUrl: '   ' }],
    ['not a string', { apiUrl: 8080 }],
  ])('rejects an apiUrl that is %s', (_label, raw) => {
    expect(() => parseAppConfig(raw)).toThrow(/"apiUrl"/);
  });

  it('rejects a relative apiUrl', () => {
    expect(() => parseAppConfig({ apiUrl: '/api' })).toThrow(/not an absolute URL/);
  });

  it('rejects a non-http(s) apiUrl', () => {
    expect(() => parseAppConfig({ apiUrl: 'ftp://api.example.com' })).toThrow(/http or https/);
  });
});

describe('loadAppConfig', () => {
  it('fetches the config without the HTTP cache and validates it', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ apiUrl: 'http://localhost:8080' }));

    await expect(loadAppConfig(fetchFn, CONFIG_URL)).resolves.toEqual({
      apiUrl: 'http://localhost:8080',
    });
    expect(fetchFn).toHaveBeenCalledWith(
      CONFIG_URL,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('fails clearly when the file is missing', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('Not found', { status: 404 }));

    await expect(loadAppConfig(fetchFn, CONFIG_URL)).rejects.toThrow(/HTTP 404/);
  });

  it('fails clearly when the request cannot be made', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(loadAppConfig(fetchFn, CONFIG_URL)).rejects.toThrow(AppConfigError);
  });

  it('fails clearly when the file is not JSON', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('<html>', { status: 200 }));

    await expect(loadAppConfig(fetchFn, CONFIG_URL)).rejects.toThrow(/not valid JSON/);
  });

  it('fails clearly when apiUrl is missing', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ api: 'x' }));

    await expect(loadAppConfig(fetchFn, CONFIG_URL)).rejects.toThrow(/missing.*"apiUrl"/);
  });

  it('defaults to config.json next to the document base URI', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ apiUrl: 'http://localhost:8080' }));

    await loadAppConfig(fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(
      new URL('config.json', document.baseURI).href,
      expect.anything(),
    );
  });
});

describe('provideAppConfig', () => {
  it('exposes the loaded config through APP_CONFIG', () => {
    TestBed.configureTestingModule({
      providers: [provideAppConfig({ apiUrl: 'https://api.example.com' })],
    });

    expect(TestBed.inject(APP_CONFIG)).toEqual({ apiUrl: 'https://api.example.com' });
  });
});
