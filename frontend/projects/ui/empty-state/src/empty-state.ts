import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

export type EmptyStateHeadingLevel = 2 | 3 | 4;

/**
 * Shown when a list or section has nothing to show yet. It says why it is empty and invites the
 * next action.
 *
 * Slots: an icon (`[uiEmptyStateIcon]`, decorative) and actions (`[uiEmptyStateActions]`, usually
 * one primary `uiButton`). The heading level is configurable so it fits the page outline.
 *
 * @example
 * <ui-empty-state heading="No people in Kumasi yet" description="Add the first person to this office.">
 *   <ui-icon uiEmptyStateIcon name="users" />
 *   <button uiEmptyStateActions uiButton>Add person</button>
 * </ui-empty-state>
 */
@Component({
  selector: 'ui-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-empty-state__icon" aria-hidden="true">
      <ng-content select="[uiEmptyStateIcon]" />
    </div>
    @switch (headingLevel()) {
      @case (3) {
        <h3 class="ui-empty-state__heading">{{ heading() }}</h3>
      }
      @case (4) {
        <h4 class="ui-empty-state__heading">{{ heading() }}</h4>
      }
      @default {
        <h2 class="ui-empty-state__heading">{{ heading() }}</h2>
      }
    }
    @if (description()) {
      <p class="ui-empty-state__description">{{ description() }}</p>
    }
    <ng-content />
    <div class="ui-empty-state__actions">
      <ng-content select="[uiEmptyStateActions]" />
    </div>
  `,
  styleUrl: './empty-state.css',
  host: { class: 'ui-empty-state' },
})
export class EmptyState {
  /** What is empty, in plain words ("No requests to review"). */
  readonly heading = input.required<string>();
  /** Why it is empty and what to do next. */
  readonly description = input<string>();
  /** Heading level that fits the page outline. */
  readonly headingLevel = input<EmptyStateHeadingLevel, unknown>(2, {
    transform: (v: unknown) => numberAttribute(v, 2) as EmptyStateHeadingLevel,
  });
}
