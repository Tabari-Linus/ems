import { TestBed } from '@angular/core/testing';
import { SessionStore } from '../services/session.store';
import { APOLLO_ERROR_HANDLER } from './apollo.config';
import { provideSessionAwareErrorHandler } from './session-error-handler';

describe('sessionAwareErrorHandler', () => {
  let load: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    load = vi.fn(() => Promise.resolve());
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [provideSessionAwareErrorHandler(), { provide: SessionStore, useValue: { load } }],
    });
  });

  const error = (code: string) => ({ code, message: 'x', violations: [] }) as never;

  it('re-reads me after a FORBIDDEN error', () => {
    TestBed.inject(APOLLO_ERROR_HANDLER)([error('FORBIDDEN')], 'Positions');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('ignores other errors, and FORBIDDEN on Me itself', () => {
    const handle = TestBed.inject(APOLLO_ERROR_HANDLER);
    handle([error('NOT_FOUND')], 'Positions');
    handle([error('FORBIDDEN')], 'Me');
    expect(load).not.toHaveBeenCalled();
  });

  it('swallows a failed reload', async () => {
    load.mockReturnValue(Promise.reject(new Error('offline')));
    expect(() => TestBed.inject(APOLLO_ERROR_HANDLER)([error('FORBIDDEN')], 'X')).not.toThrow();
    await Promise.resolve();
  });
});
