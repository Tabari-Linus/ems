---
'@ems/ui': minor
---

Layout and identity components (Daylight, Phase A3), each its own secondary entry point:
`@ems/ui/app-shell` (sidebar + top bar + main, skip link, collapsible sidebar, off-canvas drawer
below 900px), `@ems/ui/nav-item` (`a[uiNavItem]`, `aria-current` pill, badge count),
`@ems/ui/page-header`, `@ems/ui/card`, `@ems/ui/description-list` (`dl[uiDescriptionList]` +
`div[uiDescriptionItem]`, mono values, copy to clipboard), `@ems/ui/data-table` (column templates,
sortable header UI, row activation, row actions, loading, empty, sticky header, card mode),
`@ems/ui/pagination` (pages and load-more), `@ems/ui/tabs` (routed `a[uiTab]` and APG in-page
`ui-tabs`), `@ems/ui/avatar`, `@ems/ui/person-card` (`a[uiPersonCard]`) and
`@ems/ui/view-toggle` (grid/list radio group). Styling uses only the Daylight token contract.
