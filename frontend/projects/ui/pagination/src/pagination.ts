import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import { Button } from '@ems/ui/button';
import { Icon } from '@ems/icons';

export type PaginationVariant = 'pages' | 'load-more';

const formatter = new Intl.NumberFormat('en-GB');

/**
 * Result range and paging controls: "Showing 1–20 of 134" with Previous/Next, or a
 * "Load more" button (`variant="load-more"`, for lists that grow in place).
 *
 * - `page` is 1-based and two-way bindable (`[(page)]`); with `load-more`, `page` counts the
 *   pages loaded so far and `loadMore` asks for the next one.
 * - The range text is a polite live region, so the new range is announced after paging.
 * - Slot `[uiPaginationPageSize]` holds a page-size select (from the forms package).
 *
 * @example
 * <ui-pagination [(page)]="page" [pageSize]="20" [total]="134" itemLabel="people" />
 */
@Component({
  selector: 'ui-pagination',
  exportAs: 'uiPagination',
  imports: [Button, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="ui-pagination__nav" [attr.aria-label]="label()">
      <p class="ui-pagination__summary" aria-live="polite" aria-atomic="true">{{ summary() }}</p>
      <div class="ui-pagination__size"><ng-content select="[uiPaginationPageSize]" /></div>
      @if (variant() === 'load-more') {
        @if (hasNext()) {
          <button
            uiButton
            type="button"
            variant="secondary"
            size="sm"
            [loading]="loading()"
            (click)="requestMore()"
          >
            {{ loadMoreLabel() }}
          </button>
        }
      } @else {
        <div class="ui-pagination__controls">
          <button
            uiButton
            type="button"
            variant="secondary"
            size="sm"
            #previous
            [disabled]="!hasPrevious() || loading()"
            (click)="step(-1)"
          >
            <ui-icon name="chevron-left" size="sm" />
            {{ previousLabel() }}
          </button>
          <button
            uiButton
            type="button"
            variant="secondary"
            size="sm"
            #next
            [disabled]="!hasNext() || loading()"
            (click)="step(1)"
          >
            {{ nextLabel() }}
            <ui-icon name="chevron-right" size="sm" />
          </button>
        </div>
      }
    </nav>
  `,
  styleUrl: './pagination.css',
  host: {
    class: 'ui-pagination',
    '[attr.data-variant]': 'variant()',
  },
})
export class Pagination {
  /** Current page, 1-based (two-way: `[(page)]`). */
  readonly page = model(1);
  readonly pageSize = input(20, { transform: numberAttribute });
  /** Total number of items across all pages. */
  readonly total = input(0, { transform: numberAttribute });
  readonly variant = input<PaginationVariant>('pages');
  /** Noun for the items, used in the summary: "Showing 1–20 of 134 people". */
  readonly itemLabel = input('');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly label = input('Pagination');
  readonly previousLabel = input('Previous');
  readonly nextLabel = input('Next');
  readonly loadMoreLabel = input('Load more');

  /** Asks for the next page in the `load-more` variant. */
  readonly loadMore = output<number>();

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );
  protected readonly currentPage = computed(() =>
    Math.min(Math.max(1, Math.trunc(this.page()) || 1), this.pageCount()),
  );
  protected readonly hasPrevious = computed(() => this.currentPage() > 1);
  protected readonly hasNext = computed(() => this.currentPage() < this.pageCount());

  protected readonly summary = computed(() => {
    const total = this.total();
    const noun = this.itemLabel() ? ` ${this.itemLabel()}` : '';
    if (total <= 0) {
      return `No ${this.itemLabel() || 'results'}`;
    }
    const end = Math.min(total, this.currentPage() * this.pageSize());
    if (this.variant() === 'load-more') {
      return `Showing ${formatter.format(end)} of ${formatter.format(total)}${noun}`;
    }
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    return `Showing ${formatter.format(start)}–${formatter.format(end)} of ${formatter.format(total)}${noun}`;
  });

  goTo(page: number): void {
    const target = Math.min(Math.max(1, page), this.pageCount());
    if (target !== this.currentPage()) {
      this.page.set(target);
    }
  }

  private readonly injector = inject(Injector);
  private readonly previousButton = viewChild('previous', { read: ElementRef<HTMLButtonElement> });
  private readonly nextButton = viewChild('next', { read: ElementRef<HTMLButtonElement> });

  /** Previous/Next. When the pressed button becomes disabled (first/last page), focus moves to
   * the other one instead of being lost to the page. */
  protected step(delta: -1 | 1): void {
    this.goTo(this.currentPage() + delta);
    const atEdge = delta < 0 ? !this.hasPrevious() : !this.hasNext();
    if (atEdge) {
      const other = delta < 0 ? this.nextButton() : this.previousButton();
      afterNextRender(() => other?.nativeElement.focus(), { injector: this.injector });
    }
  }

  protected requestMore(): void {
    if (this.loading() || !this.hasNext()) {
      return;
    }
    this.loadMore.emit(this.currentPage() + 1);
  }
}
