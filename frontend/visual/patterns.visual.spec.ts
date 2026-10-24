import { DESKTOP, PHONE, visualSuite } from './support';

// The composed pages owners review (Patterns/*), at 1440 and 390 in both themes. The
// approve-request story is left out: its end state is a timed toast.
visualSuite({
  name: 'Patterns',
  include: ['patterns-home--', 'patterns-people-directory--'],
  exclude: ['patterns-home--approve-request'],
  viewports: () => [DESKTOP, PHONE],
  minStories: 4,
});
