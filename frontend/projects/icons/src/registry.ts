import type { LucideIconData } from '@lucide/angular';
import { EMS_ICON_DATA } from './generated/icons';

/**
 * The curated icon set, as plain Lucide icon data (name, size, node, aliases). Only icons listed
 * here are bundled.
 *
 * The data is generated from `@lucide/angular` into `generated/icons.ts` rather than read from the
 * `Lucide<Name>` component classes: each class is a full Angular component (about 2.8 kB), and
 * importing them only for their static `.icon` put every curated icon component into the initial
 * bundle. To add an icon: add `"<kebab-name>": "<LucideName>"` to `projects/icons/icons.json` and
 * run `npm run icons:build`.
 *
 * Swapping the icon library later means changing this file and `Icon`, not every call site.
 */
export const EMS_ICONS: Readonly<Record<keyof typeof EMS_ICON_DATA, LucideIconData>> =
  EMS_ICON_DATA;

/** Name of an icon in the curated set. */
export type IconName = keyof typeof EMS_ICONS;

/** All curated icon names, sorted (for docs and pickers). */
export const ICON_NAMES = Object.keys(EMS_ICONS).sort() as readonly IconName[];

/** Status tone of an alert, toast or notice. */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * One icon per status tone, shared by alerts, toasts and field errors, so the same meaning always
 * has the same shape (colour is never the only signal).
 */
export const STATUS_ICONS = {
  neutral: 'info',
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  danger: 'circle-alert',
} as const satisfies Readonly<Record<StatusTone, IconName>>;
