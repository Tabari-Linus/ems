# EMS Direction Board — shared brief for every direction

Each direction is ONE self-contained HTML page (`direction-<id>.html` in this folder) that shows the
same product content, so directions can be compared like for like. Only the visual language differs.

## Product context

EMS is an employee management system: people directory, employee profiles, org structure
(company → office → department), positions, access levels, manager-approved password resets.
Users: every employee (browses colleagues read-only, edits their own profile), managers (see their
reports' private details, approve reset requests), HR/admins (manage everything).
It must feel modern, distinctive and trustworthy — not a template, not a generic blue SaaS dashboard.

## Sample data (use exactly; fictional company)

- Company: **Akwaaba Labs**, location code **GH**. Offices: Accra (**ACC**), Kumasi (**KSI**), Takoradi (**TKD**).
- Employee numbers: `{LOCATION}-{OFFICE}-{SEQ}` e.g. `GH-ACC-0042`.
- People (name · position · level · department · office · employee no. · status):
  1. Ama Mensah · Engineering Manager · LEAD · Platform Engineering · Accra · GH-ACC-0007 · ACTIVE
  2. Kwame Asante · Senior Backend Engineer · SENIOR · Platform Engineering · Accra · GH-ACC-0042 · ACTIVE
  3. Efua Boateng · Product Designer · MID · Design · Accra · GH-ACC-0051 · ACTIVE
  4. Kofi Owusu · Data Analyst · JUNIOR · Analytics · Kumasi · GH-KSI-0013 · PENDING
  5. Abena Darko · HR Business Partner · SENIOR · People Operations · Accra · GH-ACC-0019 · ACTIVE
  6. Yaw Appiah · QA Engineer · MID · Quality Engineering · Takoradi · GH-TKD-0004 · INACTIVE
  7. Akosua Frimpong · Frontend Engineer · MID · Platform Engineering · Kumasi · GH-KSI-0021 · ACTIVE
  8. Nana Agyeman · Finance Lead · LEAD · Finance · Accra · GH-ACC-0003 · ACTIVE
  9. Esi Quaye · Intern, Engineering · INTERN · Platform Engineering · Takoradi · GH-TKD-0011 · PENDING
- Work emails: `firstname.lastname@akwaabalabs.example`.
- Kwame Asante's profile (screen 3): manager Ama Mensah; hired 2023-03-14; access level "Employee";
  bio (DOB 1994-08-02, Nationality Ghanaian); personal phone +233 24 555 0142; address
  "14 Oxford St, Osu, Accra, GA-123-4567" (current); ID documents: Ghana Card GHA-7xxxxxxx-4 (masked),
  Passport G2xxxxx (masked). Direct reports: none. Show a "Private — visible to you, your manager and HR" marker.

## Required content (in this order)

1. **Direction header**: name, one-sentence idea, 3–5 keywords.
2. **Foundations strip**: palette swatches for light AND dark (label each with its role + OKLCH value),
   type specimen (display / body / mono roles, with the scale), radius + elevation samples,
   one row of components: primary/secondary/ghost/danger buttons, an input with label + hint + error,
   status pills for ACTIVE / PENDING / INACTIVE / ARCHIVED, an avatar, a tag.
3. **Screen 1 — Sign in**: work email + password, "Forgot password?" (it sends a request to your manager),
   theme toggle, product mark. Desktop layout.
4. **Screen 2 — People directory**: app shell (sidebar nav: Dashboard, People, Requests (badge 2),
   Settings, My profile; top bar with ⌘K search hint and user menu), page title + count (9 people),
   filters (office, department, status), a search field, and the 9 people (choose table or cards —
   whatever the direction does best — showing avatar, name, position, department, office, employee no., status).
5. **Screen 3 — Employee profile** (Kwame Asante, viewed by his manager): header with avatar, name,
   position, employee no. (copy affordance), status, manager link; Work details (department, office,
   position/level, date hired, work email); Private section (bio, personal phone, address, ID documents masked)
   with the visibility marker; a secondary action set (e.g. "Approve password reset" since he has a pending request).

Render screens 1–3 **twice: light and dark, side by side** (stack on narrow widths), each inside a
device-like frame (~ 1200×760 design size; use CSS so the frame scales down to fit its column —
e.g. a fixed-width inner canvas transformed with `scale()` via a container query or a small script —
and never cause horizontal page scroll).

## Technical contract (mandatory)

- Standalone page: start with `<!doctype html>`, `<meta charset="utf-8">`,
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, a `<title>`
  ("Direction <letter> — <Name>"), base styles, and an explicit `body` background.
- Fonts ONLY from Google Fonts (`https://fonts.googleapis.com/css2?...&display=swap`) with real fallback stacks.
  No other external resources (no images from the web, no icon CDNs): draw icons as small inline SVGs,
  avatars as initials (or CSS-generated patterns). No JS libraries; small inline JS only if needed (scaling).
- All colours as CSS custom properties, defined in OKLCH. Each screen frame sets its own mode via an
  attribute (e.g. `data-mode="light"|"dark"`) that switches the token values for everything inside it.
  The page chrome itself (outside the frames) follows `prefers-color-scheme` and also honours
  `:root[data-theme="dark"|"light"]` set by the host, with tokens defined first on bare `:root`.
- Contrast: body text ≥ 4.5:1 and UI borders/focus/icons ≥ 3:1 against their surfaces in BOTH modes.
- Page works at 400px wide with no horizontal scroll (frames shrink); side gutters
  `padding-left: max(16px, env(safe-area-inset-left, 0px))` and the same for right.
- Visible `:focus-visible` styles, `prefers-reduced-motion` respected.
- Avoid generic AI looks: no cream+terracotta+serif, no near-black+acid-green/vermilion pop, no
  purple-blue gradients, no Inter/Space Grotesk as the main face, no emoji, no accent rails on cards,
  not everything centred, not rounded-lg everywhere.
- Real copy, no lorem ipsum. Concise UI copy in active voice.
- Size: keep the file under ~250 KB.
