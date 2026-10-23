import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

export type PageHeaderLevel = 1 | 2;

/**
 * Page title row: optional breadcrumbs above, the title (type role *title*) with an optional
 * count ("9 people"), a description, and page actions on the right.
 *
 * Slots: `[uiPageHeaderBreadcrumbs]` (a `<nav aria-label="Breadcrumb">` you provide) and
 * `[uiPageHeaderActions]` (buttons; keep one primary action per view).
 *
 * @example
 * <ui-page-header title="People" count="9 people">
 *   <button uiPageHeaderActions uiButton>Add person</button>
 * </ui-page-header>
 */
@Component({
  selector: 'ui-page-header',
  exportAs: 'uiPageHeader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ui-page-header__crumbs"><ng-content select="[uiPageHeaderBreadcrumbs]" /></div>
    <div class="ui-page-header__row">
      <div class="ui-page-header__text">
        <div class="ui-page-header__title-row">
          @if (level() === 2) {
            <h2 class="ui-page-header__title">{{ title() }}</h2>
          } @else {
            <h1 class="ui-page-header__title">{{ title() }}</h1>
          }
          @if (count() !== null && count() !== '') {
            <span class="ui-page-header__count">{{ count() }}</span>
          }
        </div>
        @if (description()) {
          <p class="ui-page-header__description">{{ description() }}</p>
        }
        <ng-content />
      </div>
      <div class="ui-page-header__actions"><ng-content select="[uiPageHeaderActions]" /></div>
    </div>
  `,
  styleUrl: './page-header.css',
  host: {
    class: 'ui-page-header',
    // `title` is an input here; drop the native attribute so the header gets no tooltip.
    '[attr.title]': 'null',
  },
})
export class PageHeader {
  readonly title = input.required<string>();
  /** Count shown after the title, with its noun: "9 people". */
  readonly count = input<string | number | null>(null);
  readonly description = input<string | null>(null);
  /** Heading level: 1 for a page, 2 when the header sits inside a page section. */
  readonly level = input<PageHeaderLevel, unknown>(1, {
    transform: (value: unknown) => (numberAttribute(value, 1) === 2 ? 2 : 1),
  });
}
