import { visualSuite } from './support';

// Actions & inputs other than Button: form field, input, select, checkbox, switch, password,
// search, filter pill and view toggle.
visualSuite({
  name: 'Actions and inputs',
  include: ['actions-inputs-'],
  exclude: ['actions-inputs-button--'],
  minStories: 30,
});
