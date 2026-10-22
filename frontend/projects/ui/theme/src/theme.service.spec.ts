import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { THEME_NO_FLASH_SCRIPT } from './no-flash';
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, ThemeService } from './theme.service';

type ChangeListener = (event: MediaQueryListEvent) => void;

/** A controllable `prefers-color-scheme: dark` media query. */
class FakeMediaQueryList {
  readonly listeners = new Set<ChangeListener>();
  constructor(public matches: boolean) {}
  addEventListener(_type: 'change', listener: ChangeListener): void {
    this.listeners.add(listener);
  }
  removeEventListener(_type: 'change', listener: ChangeListener): void {
    this.listeners.delete(listener);
  }
  emit(matches: boolean): void {
    this.matches = matches;
    for (const listener of this.listeners) listener({ matches } as MediaQueryListEvent);
  }
}

describe('ThemeService', () => {
  let media: FakeMediaQueryList;
  let root: HTMLElement;
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');

  // jsdom has no matchMedia, so it is defined (and removed again) per test.
  function setMatchMedia(value: ((query: string) => MediaQueryList) | undefined): void {
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value });
  }

  function create(): ThemeService {
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => {
    media = new FakeMediaQueryList(false);
    setMatchMedia(() => media as unknown as MediaQueryList);
    localStorage.clear();
    root = TestBed.inject(DOCUMENT).documentElement;
    root.removeAttribute(THEME_ATTRIBUTE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      delete (window as Partial<Window>).matchMedia;
    }
    localStorage.clear();
    root.removeAttribute(THEME_ATTRIBUTE);
  });

  it('defaults to system: no data-theme attribute, resolved from the OS setting', () => {
    media.matches = true;
    const service = create();

    expect(service.theme()).toBe('system');
    expect(service.resolved()).toBe('dark');
    expect(root.hasAttribute(THEME_ATTRIBUTE)).toBe(false);
  });

  it('follows prefers-color-scheme changes while on system', () => {
    const service = create();
    expect(service.resolved()).toBe('light');

    media.emit(true);
    expect(service.resolved()).toBe('dark');
    media.emit(false);
    expect(service.resolved()).toBe('light');
  });

  it('ignores OS changes for an explicit choice', () => {
    const service = create();
    service.setTheme('light');

    media.emit(true);
    expect(service.resolved()).toBe('light');
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe('light');
  });

  it('applies and persists light and dark', () => {
    const service = create();

    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
    expect(service.resolved()).toBe('dark');
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.setTheme('light');
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('going back to system removes the attribute and the stored value', () => {
    const service = create();
    service.setTheme('dark');

    service.setTheme('system');
    expect(root.hasAttribute(THEME_ATTRIBUTE)).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('restores a stored choice on start-up', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const service = create();

    expect(service.theme()).toBe('dark');
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
  });

  it('ignores an invalid stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(create().theme()).toBe('system');
  });

  it('falls back to system when storage throws, and still applies the choice', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const service = create();
    expect(service.theme()).toBe('system');

    expect(() => service.setTheme('dark')).not.toThrow();
    expect(service.theme()).toBe('dark');
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
  });

  it('works without matchMedia (treats the OS as light)', () => {
    setMatchMedia(undefined);
    expect(create().resolved()).toBe('light');
  });

  it('removes its media listener when the injector is destroyed', () => {
    create();
    expect(media.listeners.size).toBe(1);
    TestBed.resetTestingModule();
    expect(media.listeners.size).toBe(0);
  });

  it('exposes a no-flash snippet that uses the same key and attribute', () => {
    expect(THEME_NO_FLASH_SCRIPT).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
    expect(THEME_NO_FLASH_SCRIPT).toContain(`setAttribute('${THEME_ATTRIBUTE}', t)`);

    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    new Function(THEME_NO_FLASH_SCRIPT)();
    expect(root.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
  });
});
