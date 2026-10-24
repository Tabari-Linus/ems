---
'@ems/ui': minor
---

Daylight form components, one secondary entry point each: `@ems/ui/form-field` (label, hint,
error, required marker and ARIA wiring), `@ems/ui/input` (`input[uiInput]`, `textarea[uiInput]`,
`ui-input-group`), `@ems/ui/select` (CDK listbox `ui-select` and native `select[uiSelect]`),
`@ems/ui/checkbox`, `@ems/ui/switch`, `@ems/ui/password-input` (reveal toggle, strength meter),
`@ems/ui/search-input` (debounced query, clear, ⌘K / Ctrl K) and `@ems/ui/filter-pill`.
Value-holding components are ControlValueAccessors and work with signal forms (`[formField]`),
reactive and template-driven forms. `ui-select` and `ui-filter-pill` require `@angular/cdk`.
