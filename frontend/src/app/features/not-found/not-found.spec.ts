import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Unauthorized } from '../unauthorized/unauthorized';
import { NotFound } from './not-found';

async function render<T>(component: new () => T, signedIn: boolean) {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { isAuthenticated: () => signedIn } },
    ],
  });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  const fixture = TestBed.createComponent(component);
  await fixture.whenStable();
  return { el: fixture.nativeElement as HTMLElement, navigate };
}

describe('NotFound', () => {
  it('inside the shell: a 404 that leads Home, focused for screen readers', async () => {
    const { el, navigate } = await render(NotFound, true);
    const heading = el.querySelector('[role=heading]') as HTMLElement;
    expect(heading.getAttribute('aria-level')).toBe('1');
    expect(heading.textContent).toContain("We can't find that page");
    expect(document.activeElement).toBe(heading);
    expect(el.querySelector('app-auth-layout')).toBeNull();
    (el.querySelector('ui-error-state button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith('/home');
  });

  it('signed out: a standalone page that leads to sign in', async () => {
    const { el, navigate } = await render(NotFound, false);
    expect(el.querySelector('app-auth-layout')).not.toBeNull();
    const button = el.querySelector('ui-error-state button') as HTMLButtonElement;
    expect(button.textContent).toContain('Go to sign in');
    button.click();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});

describe('Unauthorized', () => {
  it('explains the missing access and leads Home', async () => {
    const { el, navigate } = await render(Unauthorized, true);
    const heading = el.querySelector('[role=heading]') as HTMLElement;
    expect(heading.textContent).toContain("You don't have access to this page");
    expect(document.activeElement).toBe(heading);
    (el.querySelector('ui-error-state button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith('/home');
  });
});
