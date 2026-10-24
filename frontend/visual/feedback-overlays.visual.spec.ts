import { visualSuite } from './support';

// Feedback (alert, toast, spinner, skeleton, empty/error state, status pill, tag) and overlays
// (dialog, drawer, menu, tooltip): open overlays are captured with the CDK overlay container.
visualSuite({ name: 'Feedback and overlays', include: ['feedback-', 'overlays-'], minStories: 30 });
