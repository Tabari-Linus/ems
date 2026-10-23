import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Card } from '@ems/ui/card';
import { StatusPill } from '@ems/ui/status-pill';
import { ToastService } from '@ems/ui/toast';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor, within } from 'storybook/test';
import { press } from '../testing/keyboard';
import { CHROME_IMPORTS, DEMO_PEOPLE, shell } from './chrome';

const TEAM = [DEMO_PEOPLE[1], DEMO_PEOPLE[2], DEMO_PEOPLE[6], DEMO_PEOPLE[8]];

/*
 * Story-only inline styles use tokens only. Type roles: display for the greeting (the one bold
 * moment), headline for section titles, body / caption for the rest.
 */
const HOME = `
  <div style="display:grid;gap:var(--ems-space-6)">
    <header style="display:grid;gap:var(--ems-space-2);padding-block:var(--ems-space-3) var(--ems-space-1)">
      <p style="margin:0;color:var(--ems-color-text-muted);font-size:var(--ems-type-label-size);font-weight:var(--ems-type-label-weight)">
        <time datetime="2026-10-22">Thursday, 22 October</time>
      </p>
      <h1 style="margin:0;font-size:clamp(var(--ems-type-title-size), 7vw, var(--ems-type-display-size));font-weight:var(--ems-type-display-weight);line-height:var(--ems-type-display-line-height);letter-spacing:var(--ems-type-display-letter-spacing)">
        Good morning, Ama
      </h1>
      <p style="margin:0;color:var(--ems-color-text-secondary)">
        @if (pending().length) {
          {{ pending().length === 1 ? 'One thing needs' : 'Two things need' }} you today. The rest of your team is set.
        } @else {
          Nothing needs you today. Your team is set.
        }
      </p>
    </header>

    <div style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--ems-space-5)">
      <ui-card title="Needs your attention" [count]="pending().length" flush style="flex:999 1 28rem;min-inline-size:0">
        <a uiCardActions href="#requests" style="display:inline-flex;align-items:center;gap:var(--ems-space-1);color:var(--ems-color-text-link);font-weight:var(--ems-type-label-weight);text-decoration:none">
          All requests <ui-icon name="arrow-right" size="sm" />
        </a>
        <ul style="list-style:none;margin:0;padding:var(--ems-space-2)">
          @for (item of pending(); track item.id; let first = $first) {
            <li [style.border-block-start]="first ? null : 'var(--ems-border-width-hairline) solid var(--ems-color-border-subtle)'"
              style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--ems-space-3) var(--ems-space-4);padding:var(--ems-space-4) var(--ems-space-3)">
              <ui-avatar [name]="item.person.name" [tint]="item.person.tint" decorative />
              <div style="flex:1 1 14rem;min-inline-size:0">
                @if (item.kind === 'reset') {
                  <p style="margin:0;color:var(--ems-color-text-secondary)">Password reset for <b style="color:var(--ems-color-text-primary);font-weight:var(--ems-type-headline-weight)">{{ item.person.name }}</b></p>
                  <p style="display:flex;align-items:center;gap:var(--ems-space-2);margin:var(--ems-space-1) 0 0;color:var(--ems-color-text-muted);font-size:var(--ems-type-caption-size)">
                    <ui-icon name="key" size="sm" /> Password reset request · 2h ago
                  </p>
                } @else {
                  <p style="margin:0;color:var(--ems-color-text-secondary)"><b style="color:var(--ems-color-text-primary);font-weight:var(--ems-type-headline-weight)">{{ item.person.name }}</b>’s profile is incomplete</p>
                  <p style="display:flex;align-items:center;gap:var(--ems-space-2);margin:var(--ems-space-1) 0 0;color:var(--ems-color-text-muted);font-size:var(--ems-type-caption-size)">
                    <ui-icon name="circle-alert" size="sm" /> Pending activation · Analytics, Kumasi
                  </p>
                }
              </div>
              <div style="display:flex;gap:var(--ems-space-2)">
                @if (item.kind === 'reset') {
                  <button uiButton variant="secondary" type="button" (click)="decide(item.id, false)">Decline</button>
                  <button uiButton type="button" (click)="decide(item.id, true)"><ui-icon name="check" /> Approve</button>
                } @else {
                  <a uiButton variant="ghost" href="#people/GH-KSI-0013">Review profile</a>
                }
              </div>
            </li>
          } @empty {
            <li style="padding:var(--ems-space-4) var(--ems-space-3);color:var(--ems-color-text-muted)">You are all caught up.</li>
          }
        </ul>
      </ui-card>

      <ui-card title="Quick links" flush style="flex:1 1 17rem;min-inline-size:0">
        <ul style="list-style:none;margin:0;padding:var(--ems-space-2)">
          @for (link of links; track link.label) {
            <li>
              <a [href]="link.href" style="display:flex;align-items:center;gap:var(--ems-space-3);min-block-size:var(--ems-control-lg-height);padding-inline:var(--ems-space-2);border-radius:var(--ems-radius-lg);color:var(--ems-color-text-primary);font-size:var(--ems-type-label-size);font-weight:var(--ems-type-label-weight);text-decoration:none">
                <span aria-hidden="true" style="display:grid;place-items:center;flex:none;inline-size:var(--ems-control-sm-height);block-size:var(--ems-control-sm-height);border-radius:var(--ems-radius-md);background:var(--ems-color-accent-soft);color:var(--ems-color-accent-soft-text)">
                  <ui-icon [name]="link.icon" size="sm" />
                </span>
                <span style="flex:1">{{ link.label }}</span>
                @if (link.count) {
                  <span style="color:var(--ems-color-text-muted);font-family:var(--ems-font-family-mono);font-size:var(--ems-type-mono-size);font-variant-numeric:tabular-nums">{{ link.count }}<span class="ui-visually-hidden"> {{ link.countLabel }}</span></span>
                }
                <ui-icon name="chevron-right" size="sm" style="color:var(--ems-color-text-muted)" />
              </a>
            </li>
          }
        </ul>
      </ui-card>
    </div>

    <section aria-labelledby="team-heading" style="display:grid;gap:var(--ems-space-3)">
      <div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:var(--ems-space-3)">
        <h2 id="team-heading" style="margin:0;font-size:var(--ems-type-headline-size);font-weight:var(--ems-type-headline-weight);line-height:var(--ems-type-headline-line-height);letter-spacing:var(--ems-type-headline-letter-spacing)">
          Your team <span style="margin-inline-start:var(--ems-space-2);color:var(--ems-color-text-muted);font-size:var(--ems-type-label-size);font-weight:var(--ems-type-caption-weight)">4 direct reports</span>
        </h2>
        <a href="#people" style="display:inline-flex;align-items:center;gap:var(--ems-space-1);color:var(--ems-color-text-link);font-size:var(--ems-type-label-size);font-weight:var(--ems-type-label-weight);text-decoration:none">
          View team <ui-icon name="arrow-right" size="sm" />
        </a>
      </div>
      <ul style="list-style:none;margin:0;padding:0;display:grid;gap:var(--ems-space-3);grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))">
        @for (p of team; track p.employeeNo) {
          <li style="display:grid">
            <ui-card radius="xl">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--ems-space-2);margin-block-end:var(--ems-space-3)">
                <ui-avatar [name]="p.name" [tint]="p.tint" size="md" decorative />
                <ui-status-pill [status]="p.status" />
              </div>
              <p style="margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:var(--ems-type-headline-weight)">{{ p.name }}</p>
              <p style="margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ems-color-text-muted);font-size:var(--ems-type-caption-size)">{{ p.position }}</p>
            </ui-card>
          </li>
        }
      </ul>
    </section>
  </div>`;

interface PendingItem {
  id: number;
  kind: 'reset' | 'incomplete';
  person: (typeof DEMO_PEOPLE)[number];
}

/** The employee Home (direction-d screen 2), composed from @ems/ui with demo data. */
@Component({
  selector: 'ui-demo-home-page',
  imports: [...CHROME_IMPORTS, Card, StatusPill],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: shell('home', HOME, { collapsible: false }),
})
class HomePage {
  private readonly toasts = inject(ToastService);
  protected readonly team = TEAM;
  protected readonly pending = signal<readonly PendingItem[]>([
    { id: 1, kind: 'reset', person: DEMO_PEOPLE[1] },
    { id: 2, kind: 'incomplete', person: DEMO_PEOPLE[3] },
  ]);
  protected readonly links = [
    { label: 'My profile', href: '#my-profile', icon: 'user', count: null, countLabel: '' },
    { label: 'People', href: '#people', icon: 'users', count: 9, countLabel: 'people' },
    { label: 'Requests', href: '#requests', icon: 'inbox', count: 2, countLabel: 'open' },
  ] as const;

  protected decide(id: number, approve: boolean): void {
    const item = this.pending().find((i) => i.id === id);
    this.pending.update((items) => items.filter((i) => i.id !== id));
    if (!item) return;
    const first = item.person.name.split(' ')[0];
    if (approve) {
      this.toasts.success(`Approved. ${first} gets an email to set a new password.`);
    } else {
      this.toasts.info(`Declined. ${first}'s password stays as it is.`);
    }
  }
}

const meta: Meta = {
  title: 'Patterns/Home',
  decorators: [moduleMetadata({ imports: [HomePage] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The employee **Home** (direction-d, screen 2): the one bold moment of Daylight. A date, a large
greeting in the \`display\` role, then *Needs your attention* with the decision buttons on the row,
quick links and the team.

Built only from @ems/ui: \`ui-app-shell\` + \`a[uiNavItem]\`, \`ui-search-input\` (⌘K), the user menu
on \`[uiMenuTrigger]\` / \`ui-menu\`, \`ui-card\` with a count, \`ui-avatar\`, \`uiButton\`,
\`ui-status-pill\`, \`ui-icon\` and \`ui-toaster\` (Approve / Decline confirm with a toast).
Page-level layout uses tokens only.
`,
      },
    },
  },
  render: () => ({ template: '<ui-demo-home-page />' }),
};

export default meta;
type Story = StoryObj;

export const Home: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Good morning, Ama' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { level: 2, name: /Needs your attention/ }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(canvas.getByRole('button', { name: 'Approve' })).toBeVisible();
  },
};

export const ApproveRequest: Story = {
  name: 'Approve a request (keyboard)',
  play: async ({ canvas, userEvent }) => {
    const approve = canvas.getByRole('button', { name: 'Approve' });
    approve.focus();
    await userEvent.keyboard('{Enter}');

    const toaster = within(document.body).getByRole('region', { name: 'Notifications' });
    await waitFor(() => expect(toaster).toHaveTextContent('Approved. Kwame gets an email'));
    await expect(canvas.queryByRole('button', { name: 'Approve' })).toBeNull();
    await expect(canvas.getByText(/One thing needs you today/)).toBeVisible();
  },
};

export const UserMenu: Story = {
  name: 'User menu',
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Account menu, Ama Mensah' });
    trigger.focus();
    press('Enter');
    const menu = await within(document.body).findByRole('menu');
    await expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((i) => i.textContent?.trim()),
    ).toEqual(['My profile', 'Settings', 'Sign out']);
  },
};
