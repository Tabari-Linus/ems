import * as lucide from '@lucide/angular';
import { EMS_ICONS, ICON_NAMES, STATUS_ICONS } from './registry';

/** `circle-alert` -> `LucideCircleAlert`, the @lucide/angular component for that icon. */
function lucideClassName(iconName: string): string {
  return `Lucide${iconName.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())}`;
}

describe('EMS_ICONS', () => {
  // The registry carries generated plain data instead of the component classes (bundle size).
  // This guards the generated file against drift from the installed @lucide/angular.
  it.each(ICON_NAMES)('%s matches the data of its @lucide/angular component', (name) => {
    const data = EMS_ICONS[name];
    const component = (lucide as unknown as Record<string, { icon?: unknown } | undefined>)[
      lucideClassName(data.name)
    ];

    expect(component?.icon).toEqual(data);
  });

  it('maps every status tone to a curated icon', () => {
    for (const icon of Object.values(STATUS_ICONS)) {
      expect(ICON_NAMES).toContain(icon);
    }
  });
});
