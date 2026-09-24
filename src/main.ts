import App from '@/App.vue'
import AppLayoutDrawer from '@/layouts/AppLayoutDrawer.vue'
import AppLayoutFullscreen from '@/layouts/AppLayoutFullscreen.vue'
import AppLayoutLoader from '@/layouts/AppLayoutLoader.vue'
import AppLayoutMain from '@/layouts/AppLayoutMain.vue'
// Vuetify's stylesheets (with the MDI icons) before common-admin's, whose rules are not in a layer:
// the cascade depends on the order. The comment after this block keeps the import sorting out of it.
import { AnzuSystemsCommonAdmin, loadCommonFonts } from '@anzusystems/common-admin'
import type { PluginOptions } from '@anzusystems/common-admin'

import { vuetify } from '@/plugins/vuetify'
import { router } from '@/router'
import { envConfig, loadEnvConfig } from '@/shared/EnvConfigService'
import '@anzusystems/common-admin/styles'
// End of the stylesheet order.
import * as Sentry from '@sentry/vue'
import dayjs from 'dayjs'
import Duration from 'dayjs/plugin/duration'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, i18n } from '@/plugins/i18n'
import { damClient } from '@/shared/apiClients/damClient'

dayjs.extend(Duration)

loadCommonFonts()

loadEnvConfig(() => {
  const app = createApp(App)
    .use(i18n)
    .use(createPinia())
    .use(vuetify)
    .use(router)
    .use<PluginOptions>(AnzuSystemsCommonAdmin, {
      languages: {
        available: AVAILABLE_LANGUAGES,
        default: DEFAULT_LANGUAGE,
      },
      coreDam: {
        configs: {
          default: {
            damClient: damClient,
          },
        },
        apiTimeout: envConfig.dam.apiTimeout,
        uploadStatusFallback: envConfig.uploadStatusFallback,
        adminDomain: envConfig.dam.adminUrl,
        notification: {
          enabled: envConfig.notification.enabled,
          webSocketUrl: envConfig.notification.webSocketUrl,
        },
      },
    })
    .component('AppLayoutLoader', AppLayoutLoader)
    .component('AppLayoutMain', AppLayoutMain)
    .component('AppLayoutDrawer', AppLayoutDrawer)
    .component('AppLayoutFullscreen', AppLayoutFullscreen)

  if (envConfig.sentry.dsn) {
    Sentry.init({
      app,
      dsn: envConfig.sentry.dsn,
      release: envConfig.appVersion,
      environment: envConfig.appEnvironment,
      dataCollection: {
        userInfo: true,
        cookies: true,
        httpHeaders: { request: true, response: true },
        urlQueryParams: true,
      },
      tracesSampleRate: 0,
      replaysOnErrorSampleRate: 0.2,
      transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
      integrations: [
        Sentry.browserTracingIntegration({ router, routeLabel: 'path' }),
        Sentry.replayIntegration({
          maskAllText: false,
          maskAllInputs: false,
          blockAllMedia: false,
        }),
        Sentry.httpClientIntegration(),
      ],
    })
  }

  app.mount('#app')
})
