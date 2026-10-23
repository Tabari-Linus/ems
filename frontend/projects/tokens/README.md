# @ems/tokens

EMS design tokens in W3C DTCG format, built with Style Dictionary: the Daylight direction (D30).
Variable names are fixed in `docs/design/token-contract.md`.

- `css/tokens.css`: `--ems-*` custom properties in `@layer tokens` (light on `:root`, dark on
  `[data-theme='dark']` and `prefers-color-scheme: dark`).
- `tokens.json`, and the `tokens` / `cssVar()` TS export: every token with resolved values per theme.
- `dtcg/`: the DTCG sources.

See `frontend/projects/README.md` for tiers, how to add a token and the contrast gate.
