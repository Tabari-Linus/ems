import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Employee lifecycle status as the API returns it. */
export type EmployeeStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'ARCHIVED';
/** Generic tone for statuses that are not an employee status (requests, imports, jobs). */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
/** Dot shape. Shape, not only colour, tells the statuses apart (WCAG 1.4.1). */
export type StatusDotShape = 'filled' | 'half' | 'ring' | 'square';

/** Default label and dot shape per employee status. */
export const EMPLOYEE_STATUS_PRESENTATION: Readonly<
  Record<EmployeeStatus, { label: string; shape: StatusDotShape }>
> = {
  ACTIVE: { label: 'Active', shape: 'filled' },
  PENDING: { label: 'Pending', shape: 'half' },
  INACTIVE: { label: 'Inactive', shape: 'ring' },
  ARCHIVED: { label: 'Archived', shape: 'square' },
};

const TONE_SHAPE: Readonly<Record<StatusTone, StatusDotShape>> = {
  success: 'filled',
  warning: 'half',
  danger: 'square',
  info: 'ring',
  neutral: 'ring',
};

/**
 * A status pill: soft tinted background, a dot whose SHAPE encodes the status, and a text label.
 * The label is plain text in the accessible name; the dot is decorative.
 *
 * - `status` (employee status) picks the `employee-status` colours, label and shape.
 * - Otherwise `tone` picks the generic status colours; put the label in the content.
 *
 * @example
 * <ui-status-pill status="PENDING" />
 * <ui-status-pill tone="danger">Declined</ui-status-pill>
 */
@Component({
  selector: 'ui-status-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ui-status-pill__dot" aria-hidden="true"></span>
    <span class="ui-status-pill__label">{{ text() }}<ng-content /></span>
  `,
  styleUrl: './status-pill.css',
  host: {
    class: 'ui-status-pill',
    '[attr.data-status]': 'status() ?? null',
    '[attr.data-tone]': 'status() ? null : tone()',
    '[attr.data-shape]': 'dotShape()',
  },
})
export class StatusPill {
  /** Employee status; takes precedence over `tone`. */
  readonly status = input<EmployeeStatus>();
  /** Generic tone when `status` is not set. */
  readonly tone = input<StatusTone>('neutral');
  /** Overrides the default label (e.g. a translated one). */
  readonly label = input<string>();
  /** Overrides the default dot shape. */
  readonly shape = input<StatusDotShape>();

  protected readonly text = computed(() => {
    const status = this.status();
    return this.label() ?? (status ? EMPLOYEE_STATUS_PRESENTATION[status].label : '');
  });

  protected readonly dotShape = computed<StatusDotShape>(() => {
    const status = this.status();
    return (
      this.shape() ??
      (status ? EMPLOYEE_STATUS_PRESENTATION[status].shape : TONE_SHAPE[this.tone()])
    );
  });
}
