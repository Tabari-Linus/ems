---
'@ems/ui': minor
---

Feedback and overlay components (Daylight, Phase A2), each a secondary entry point styled only with
contract tokens: `@ems/ui/alert` (inline notice, severity-based live role), `@ems/ui/toast`
(`ToastService` + `ui-toaster` polite live region, pause on hover/focus, queue of 3),
`@ems/ui/spinner`, `@ems/ui/skeleton`, `@ems/ui/empty-state`, `@ems/ui/error-state` (403/404/500/
network copy and recovery action), `@ems/ui/status-pill` (employee status with dot shapes, generic
tones), `@ems/ui/tag` (removable), `@ems/ui/dialog` (`DialogService` on CDK Dialog, `ui-dialog`
layout, `confirm()`), `@ems/ui/drawer` (end side sheet, full screen on phones), `@ems/ui/menu` (CDK
Menu) and `@ems/ui/tooltip` (`aria-describedby`, WCAG 1.4.13). Adds `@angular/cdk` as a peer
dependency.
