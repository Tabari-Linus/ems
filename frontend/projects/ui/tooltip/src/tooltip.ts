import { AriaDescriber } from '@angular/cdk/a11y';
import {
  type ConnectedPosition,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  type ComponentRef,
  DestroyRef,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
} from '@angular/core';

export type TooltipPosition = 'above' | 'below' | 'start' | 'end';

const GAP = 8;

const POSITIONS: Readonly<Record<TooltipPosition, ConnectedPosition[]>> = {
  above: [
    { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -GAP },
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: GAP },
  ],
  below: [
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: GAP },
    { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -GAP },
  ],
  start: [
    { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -GAP },
    { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: GAP },
  ],
  end: [
    { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: GAP },
    { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -GAP },
  ],
};

/** The visible bubble. The text reaches assistive technology via `aria-describedby` instead. */
@Component({
  selector: 'ui-tooltip-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ text() }}`,
  styleUrl: './tooltip.css',
  host: {
    class: 'ui-tooltip',
    role: 'tooltip',
    'aria-hidden': 'true',
    '(mouseenter)': 'pointerEnter.emit()',
    '(mouseleave)': 'pointerLeave.emit()',
  },
})
export class TooltipPanel {
  readonly text = input('');
  readonly pointerEnter = output<void>();
  readonly pointerLeave = output<void>();
}

/**
 * A short text hint shown on hover (after `uiTooltipShowDelay`) and on keyboard focus, for an
 * element that already has an accessible name (e.g. an icon button with `aria-label`). The text is
 * linked with `aria-describedby`, so screen readers get it whether or not the bubble is shown.
 *
 * Meets WCAG 1.4.13: Escape dismisses it, the pointer can move onto it without it disappearing,
 * and it stays until pointer or focus leaves. Never put essential information or interactive
 * content in a tooltip.
 *
 * @example
 * <button uiButton variant="ghost" aria-label="Copy employee number" uiTooltip="Copy GH-ACC-0042">…</button>
 */
@Directive({
  selector: '[uiTooltip]',
  exportAs: 'uiTooltip',
  host: {
    '(mouseenter)': 'show(showDelay())',
    '(mouseleave)': 'hide(hideDelay())',
    '(focusin)': 'show(0)',
    '(focusout)': 'hide(0)',
  },
})
export class Tooltip {
  /** Tooltip text; empty disables the tooltip. */
  readonly text = input('', { alias: 'uiTooltip' });
  readonly position = input<TooltipPosition>('above', { alias: 'uiTooltipPosition' });
  /** Hover delay in ms before showing (focus shows at once). */
  readonly showDelay = input(400, { alias: 'uiTooltipShowDelay', transform: numberAttribute });
  /** Delay in ms before hiding after the pointer leaves, so it can move onto the bubble. */
  readonly hideDelay = input(120, { alias: 'uiTooltipHideDelay', transform: numberAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly describer = inject(AriaDescriber);
  private overlayRef: OverlayRef | null = null;
  private panel: ComponentRef<TooltipPanel> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private described = '';

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen) {
      event.stopPropagation();
      this.hide(0);
    }
  };

  constructor() {
    effect(() => {
      const text = this.text().trim();
      if (this.described) this.describer.removeDescription(this.host, this.described);
      this.described = text;
      if (text) {
        this.describer.describe(this.host, text);
      } else {
        this.hide(0);
      }
      this.panel?.setInput('text', text);
    });

    inject(DestroyRef).onDestroy(() => {
      this.clearTimer();
      this.detach();
      if (this.described) this.describer.removeDescription(this.host, this.described);
      this.overlayRef?.dispose();
    });
  }

  /** Whether the bubble is on screen. */
  get isOpen(): boolean {
    return !!this.overlayRef?.hasAttached();
  }

  /** Shows the bubble after `delay` ms. */
  show(delay = 0): void {
    this.clearTimer();
    if (!this.text().trim() || this.isOpen) return;
    const open = () => this.attach();
    if (delay > 0) {
      this.timer = setTimeout(open, delay);
    } else {
      open();
    }
  }

  /** Hides the bubble after `delay` ms. */
  hide(delay = 0): void {
    this.clearTimer();
    if (delay > 0) {
      this.timer = setTimeout(() => this.detach(), delay);
    } else {
      this.detach();
    }
  }

  private attach(): void {
    this.timer = null;
    const overlayRef = this.getOverlayRef();
    const strategy = overlayRef.getConfig().positionStrategy;
    (strategy as ReturnType<typeof createFlexibleConnectedPositionStrategy>).withPositions(
      POSITIONS[this.position()],
    );
    this.panel = overlayRef.attach(new ComponentPortal(TooltipPanel, null, this.injector));
    this.panel.setInput('text', this.text().trim());
    this.panel.instance.pointerEnter.subscribe(() => this.clearTimer());
    this.panel.instance.pointerLeave.subscribe(() => this.hide(this.hideDelay()));
    this.document.addEventListener('keydown', this.onKeydown, true);
  }

  private detach(): void {
    this.timer = null;
    this.document.removeEventListener('keydown', this.onKeydown, true);
    if (this.overlayRef?.hasAttached()) this.overlayRef.detach();
    this.panel = null;
  }

  private getOverlayRef(): OverlayRef {
    this.overlayRef ??= createOverlayRef(this.injector, {
      positionStrategy: createFlexibleConnectedPositionStrategy(this.injector, this.host)
        .withFlexibleDimensions(false)
        .withViewportMargin(GAP),
      scrollStrategy: createRepositionScrollStrategy(this.injector),
      panelClass: 'ui-tooltip-pane',
    });
    return this.overlayRef;
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
