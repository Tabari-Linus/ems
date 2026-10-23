import { visualSuite } from './support';

// Every Button story (variants, sizes, states), light + dark, + axe.
visualSuite({ name: 'Button', include: ['actions-inputs-button--'], minStories: 10 });
