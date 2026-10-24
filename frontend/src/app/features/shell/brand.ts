import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The EMS mark (a sun rising over the horizon, from direction-d) with the product name.
 * The glyph is decorative; the name is text.
 */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="brand__mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M5.5 15.5a6.5 6.5 0 0 1 13 0z" fill="currentColor" />
        <path
          d="M4 18.5h16"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          fill="none"
        />
      </svg>
    </span>
    <b class="brand__name">EMS</b>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--ems-space-3);
      min-inline-size: 0;
      color: var(--ems-color-text-primary);
    }

    .brand__mark {
      display: grid;
      flex: none;
      place-items: center;
      inline-size: var(--ems-control-sm-height);
      block-size: var(--ems-control-sm-height);
      border-radius: var(--ems-radius-md);
      background: var(--ems-color-accent-solid);
      color: var(--ems-color-accent-on-solid);
    }

    .brand__mark svg {
      inline-size: var(--ems-icon-size-md);
      block-size: var(--ems-icon-size-md);
    }

    .brand__name {
      font-size: var(--ems-type-headline-size);
      font-weight: var(--ems-type-title-weight);
      letter-spacing: var(--ems-type-headline-letter-spacing);
    }

    @media (forced-colors: active) {
      .brand__mark {
        border: var(--ems-border-width-hairline) solid CanvasText;
      }
    }
  `,
})
export class Brand {}
