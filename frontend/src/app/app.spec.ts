import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

@Component({
  selector: 'app-stub-page',
  template: '<h1>Stub page</h1>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StubPage {}

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([{ path: 'stub', component: StubPage }])],
    });
  });

  it('renders the routed page inside its router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/stub');
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('router-outlet')).not.toBeNull();
    expect(host.querySelector('app-stub-page h1')?.textContent).toBe('Stub page');
  });

  it('renders the outlet and the one toast host before navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(Array.from(host.children).map((c) => c.tagName.toLowerCase())).toEqual([
      'router-outlet',
      'ui-toaster',
    ]);
  });
});
