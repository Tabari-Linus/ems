import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

let nextId = 0;

export type CardHeadingLevel = 2 | 3 | 4;

/**
 * Titled section card: white surface, soft layered shadow (`--ems-elevation-card`), large radius.
 *
 * With a `title` the card is a `<section>` labelled by its heading (a region landmark).
 * Without one it is a plain, unnamed section.
 *
 * Slots: `[uiCardActions]` header actions (links/buttons, right of the title), default body,
 * `[uiCardFooter]` footer row. `flush` removes the body padding (tables, edge-to-edge lists).
 *
 * @example
 * <ui-card title="Needs your attention" [count]="2">
 *   <a uiCardActions href="/requests">All requests</a>
 *   …
 * </ui-card>
 */
@Component({
  selector: 'ui-card',
  exportAs: 'uiCard',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ui-card__surface" [attr.aria-labelledby]="title() ? headingId : null">
      @if (title()) {
        <div class="ui-card__header">
          @switch (level()) {
            @case (3) {
              <h3 class="ui-card__title" [id]="headingId">
                <ng-container *ngTemplateOutlet="heading" />
              </h3>
            }
            @case (4) {
              <h4 class="ui-card__title" [id]="headingId">
                <ng-container *ngTemplateOutlet="heading" />
              </h4>
            }
            @default {
              <h2 class="ui-card__title" [id]="headingId">
                <ng-container *ngTemplateOutlet="heading" />
              </h2>
            }
          }
          <div class="ui-card__actions"><ng-content select="[uiCardActions]" /></div>
        </div>
      }
      <div class="ui-card__body"><ng-content /></div>
      <div class="ui-card__footer"><ng-content select="[uiCardFooter]" /></div>
    </section>
    <ng-template #heading>
      {{ title() }}
      @if (hasCount()) {
        <span class="ui-card__count">{{ count() }}</span>
      }
    </ng-template>
  `,
  styleUrl: './card.css',
  host: {
    class: 'ui-card',
    '[attr.data-flush]': 'flush() ? "" : null',
    '[attr.data-radius]': 'radius()',
    '[attr.title]': 'null',
  },
})
export class Card {
  /** Section title. Also names the region for assistive technology. */
  readonly title = input<string | null>(null);
  /** Count badge after the title (soft indigo pill). Hidden when null. */
  readonly count = input<string | number | null>(null);
  /** Heading level of the title within the page outline. */
  readonly level = input<CardHeadingLevel, unknown>(2, {
    transform: (value: unknown) => {
      const n = numberAttribute(value, 2);
      return (n === 3 || n === 4 ? n : 2) as CardHeadingLevel;
    },
  });
  /** No body padding: for tables and lists that run edge to edge. */
  readonly flush = input(false, { transform: booleanAttribute });
  /** Corner radius: `lg` (12px) or `xl` (14px, default). */
  readonly radius = input<'lg' | 'xl'>('xl');

  protected readonly headingId = `ui-card-title-${nextId++}`;
  protected readonly hasCount = computed(() => {
    const count = this.count();
    return count !== null && count !== undefined && count !== '';
  });
}
