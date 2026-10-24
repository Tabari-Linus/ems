import {
  LucideArrowDown,
  LucideArrowLeft,
  LucideArrowRight,
  LucideArrowUp,
  LucideBell,
  LucideBriefcase,
  LucideBuilding,
  LucideCalendar,
  LucideCheck,
  LucideChevronDown,
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronUp,
  LucideChevronsUpDown,
  LucideCircleAlert,
  LucideCircleCheck,
  LucideCopy,
  LucideDownload,
  LucideEllipsis,
  LucideExternalLink,
  LucideEye,
  LucideEyeOff,
  LucideFunnel,
  LucideHouse,
  LucideInbox,
  LucideInfo,
  LucideKeyRound,
  LucideLayoutGrid,
  LucideList,
  LucideLoaderCircle,
  LucideLock,
  LucideLogOut,
  LucideMail,
  LucideMenu,
  LucideMinus,
  LucideMonitor,
  LucideMoon,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucidePencil,
  LucidePhone,
  LucidePlus,
  LucideSearch,
  LucideSettings,
  LucideSun,
  LucideTrash,
  LucideTriangleAlert,
  LucideUpload,
  LucideUser,
  LucideUsers,
  LucideWifiOff,
  LucideX,
  type LucideIconData,
} from '@lucide/angular';

/**
 * The curated icon set. Only icons listed here are bundled (named imports keep the rest of
 * Lucide tree-shaken). To add one: import its `Lucide<Name>` class above and add a kebab-case
 * key. Brand glyphs can be added as plain `LucideIconData` objects.
 *
 * Swapping the icon library later means changing this file and `Icon`, not every call site.
 */
export const EMS_ICONS = {
  'arrow-down': LucideArrowDown.icon,
  'arrow-left': LucideArrowLeft.icon,
  'arrow-right': LucideArrowRight.icon,
  'arrow-up': LucideArrowUp.icon,
  bell: LucideBell.icon,
  briefcase: LucideBriefcase.icon,
  building: LucideBuilding.icon,
  calendar: LucideCalendar.icon,
  check: LucideCheck.icon,
  'chevron-down': LucideChevronDown.icon,
  'chevron-left': LucideChevronLeft.icon,
  'chevron-right': LucideChevronRight.icon,
  'chevron-up': LucideChevronUp.icon,
  'chevrons-up-down': LucideChevronsUpDown.icon,
  'circle-alert': LucideCircleAlert.icon,
  'circle-check': LucideCircleCheck.icon,
  copy: LucideCopy.icon,
  download: LucideDownload.icon,
  ellipsis: LucideEllipsis.icon,
  'external-link': LucideExternalLink.icon,
  eye: LucideEye.icon,
  'eye-off': LucideEyeOff.icon,
  filter: LucideFunnel.icon,
  home: LucideHouse.icon,
  inbox: LucideInbox.icon,
  info: LucideInfo.icon,
  key: LucideKeyRound.icon,
  'layout-grid': LucideLayoutGrid.icon,
  list: LucideList.icon,
  loader: LucideLoaderCircle.icon,
  lock: LucideLock.icon,
  'log-out': LucideLogOut.icon,
  mail: LucideMail.icon,
  menu: LucideMenu.icon,
  minus: LucideMinus.icon,
  monitor: LucideMonitor.icon,
  moon: LucideMoon.icon,
  'panel-left-close': LucidePanelLeftClose.icon,
  'panel-left-open': LucidePanelLeftOpen.icon,
  pencil: LucidePencil.icon,
  phone: LucidePhone.icon,
  plus: LucidePlus.icon,
  search: LucideSearch.icon,
  settings: LucideSettings.icon,
  sun: LucideSun.icon,
  trash: LucideTrash.icon,
  'triangle-alert': LucideTriangleAlert.icon,
  upload: LucideUpload.icon,
  user: LucideUser.icon,
  users: LucideUsers.icon,
  'wifi-off': LucideWifiOff.icon,
  x: LucideX.icon,
} as const satisfies Readonly<Record<string, LucideIconData>>;

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
