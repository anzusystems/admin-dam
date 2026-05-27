import App from '@/App.vue'
import AppLayoutLoader from '@/layouts/AppLayoutLoader.vue'
import AppLayoutMain from '@/layouts/AppLayoutMain.vue'
import AppLayoutDrawer from '@/layouts/AppLayoutDrawer.vue'
import AppLayoutBlank from '@/layouts/AppLayoutBlank.vue'
import AppLayoutFullscreen from '@/layouts/AppLayoutFullscreen.vue'
import { vuetify } from '@/plugins/vuetify'
import { router } from '@/router'
import { envConfig, loadEnvConfig } from '@/services/EnvConfigService'
import { initErrorHandler } from '@/services/ErrorHandlerApiService'
import { AnzuSystemsCommonAdmin, loadCommonFonts, type PluginOptions } from '@anzusystems/common-admin'
import '@anzusystems/common-admin/styles'
import { damClient } from '@/services/api/clients/damClient'
import dayjs from 'dayjs'
import Duration from 'dayjs/plugin/duration'
import * as Sentry from '@sentry/vue'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, i18n } from '@/plugins/i18n'

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
        uploadStatusFallback: true,
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
    .component('AppLayoutBlank', AppLayoutBlank)
    .component('AppLayoutFullscreen', AppLayoutFullscreen)

  if (envConfig.sentry.dsn) {
    Sentry.init({
      app,
      dsn: envConfig.sentry.dsn,
      release: envConfig.appVersion,
      environment: envConfig.appEnvironment,
      sendDefaultPii: true,
      tracesSampleRate: 0,
      profilesSampleRate: 0,
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
  } else {
    initErrorHandler(app)
  }

  app.mount('#app')
})
