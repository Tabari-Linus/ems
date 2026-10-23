import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { loadAppConfig, provideAppConfig } from './app/core/config/app-config';

// The runtime config is fetched before bootstrap so APP_CONFIG is a plain, immutable value
// that any provider factory (HttpClient services, Apollo) can inject synchronously.
loadAppConfig()
  .then((config) =>
    bootstrapApplication(App, {
      ...appConfig,
      providers: [provideAppConfig(config), ...appConfig.providers],
    }),
  )
  .catch((err: unknown) => console.error('[EMS] Application failed to start.', err));
