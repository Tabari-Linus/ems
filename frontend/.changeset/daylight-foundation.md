---
'@ems/tokens': minor
'@ems/ui': minor
---

Daylight foundation (Slice DS, decision D30). `@ems/tokens`: placeholder values replaced by the
Daylight palette (indigo accent at hue 272, indigo-tinted neutrals, status, employee-status and
department avatar tints, light and dark), layered elevation, radius, 4-pt spacing, motion, z-index
and type roles, with names from `docs/design/token-contract.md`; new `foundation` tier; contrast
gate covers 92 pairs in both themes. Breaking for early consumers: `color.accent.N` primitives are
now `color.indigo.N`, `color.text.default` is `color.text.primary`, `radius.full` is `radius.pill`,
`text.body.*` is `type.body.*`. `@ems/ui`: self-hosted Plus Jakarta Sans and Geist Mono, Angular CDK
overlay CSS, base styles from the type roles, overlay/type utilities, and the Daylight pill Button.
`@angular/cdk` is now a peer dependency.
