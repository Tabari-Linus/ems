/** Shared layout for the Foundations pages. Uses tokens only, like any component. */
export const DOC_STYLES = `
  :host {
    display: block;
    max-inline-size: 72rem;
    color: var(--ems-color-text-primary);
    font-family: var(--ems-font-family-sans);
  }
  .lead {
    color: var(--ems-color-text-secondary);
    max-inline-size: 64ch;
    margin-block: var(--ems-space-2) var(--ems-space-8);
  }
  h1 {
    font-size: var(--ems-type-title-size);
    font-weight: var(--ems-type-title-weight);
    line-height: var(--ems-type-title-line-height);
    letter-spacing: var(--ems-type-title-letter-spacing);
  }
  h2 {
    font-size: var(--ems-type-headline-size);
    font-weight: var(--ems-type-headline-weight);
    line-height: var(--ems-type-headline-line-height);
    letter-spacing: var(--ems-type-headline-letter-spacing);
    margin-block: var(--ems-space-10) var(--ems-space-1);
  }
  h2 + p {
    color: var(--ems-color-text-muted);
    font-size: var(--ems-type-caption-size);
    margin-block-end: var(--ems-space-4);
    max-inline-size: 72ch;
  }
  .card {
    background: var(--ems-color-bg-surface);
    border-radius: var(--ems-radius-xl);
    box-shadow: var(--ems-elevation-card);
    padding: var(--ems-space-2) var(--ems-space-5);
    overflow-x: auto;
  }
  table {
    border-collapse: collapse;
    inline-size: 100%;
    font-size: var(--ems-type-caption-size);
  }
  caption {
    text-align: start;
  }
  th,
  td {
    text-align: start;
    padding: var(--ems-space-3) var(--ems-space-3) var(--ems-space-3) 0;
    border-block-end: var(--ems-border-width-hairline) solid var(--ems-color-border-subtle);
    vertical-align: middle;
  }
  tr:last-child > * {
    border-block-end: 0;
  }
  thead th {
    color: var(--ems-color-text-muted);
    font-weight: var(--ems-type-caption-weight);
  }
  code {
    font-family: var(--ems-font-family-mono);
    font-size: var(--ems-type-mono-size);
    font-weight: var(--ems-type-mono-weight);
    color: var(--ems-color-text-secondary);
  }
  .role {
    font-weight: var(--ems-type-body-strong-weight);
    color: var(--ems-color-text-primary);
  }
  .muted {
    color: var(--ems-color-text-muted);
  }
  .swatch {
    display: inline-block;
    inline-size: 2.25rem;
    block-size: 1.5rem;
    border-radius: var(--ems-radius-sm);
    box-shadow: inset 0 0 0 var(--ems-border-width-hairline) var(--ems-color-border-subtle);
    vertical-align: middle;
    margin-inline-end: var(--ems-space-2);
  }
`;
