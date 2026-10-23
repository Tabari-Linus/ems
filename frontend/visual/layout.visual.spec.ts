import { DESKTOP, PHONE, visualSuite } from './support';

// Layout, navigation and data display. App-shell stories also at 1440 and 390 (drawer, wrapping).
visualSuite({
  name: 'Layout, navigation and data display',
  include: ['layout-', 'navigation-', 'data-display-'],
  viewports: (id) => (id.startsWith('layout-app-shell--') ? [DESKTOP, PHONE] : undefined),
  minStories: 30,
});
