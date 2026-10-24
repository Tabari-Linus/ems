# @ems/icons

`<ui-icon>` over a curated set of [Lucide](https://lucide.dev) icons, rendered with
`@lucide/angular`'s `LucideDynamicIcon`. Decorative by default (`aria-hidden`); pass `label` for a
meaningful icon (`role="img"` + `aria-label`).

The set is plain icon data (`src/generated/icons.ts`), generated from the installed
`@lucide/angular` by `npm run icons:build`. The `Lucide<Name>` component classes are not imported:
each is a full Angular component (about 2.8 kB), and importing them only for their `.icon` data put
every curated icon component into the app's initial bundle. `registry.spec.ts` checks the
generated data against the components, so a Lucide upgrade that changes an icon fails the tests
until `icons:build` is re-run.

To add an icon: add `"<kebab-name>": "<LucideName>"` to `icons.json` (the Lucide name is the
component name without `Lucide`, e.g. `"filter": "Funnel"`), then run `npm run icons:build` and
commit the generated file. `npm run icons:check` fails when the generated file is out of date.

See `frontend/projects/README.md`.
