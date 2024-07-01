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
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { AnzuSystemsCommonAdmin, i18n, type LanguageCode, loadCommonFonts } from '@anzusystems/common-admin'
import '@anzusystems/common-admin/styles'
import { damClient } from '@/services/api/clients/damClient'
import dayjs from 'dayjs'
import Duration from 'dayjs/plugin/duration'

export const DEFAULT_LANGUAGE: LanguageCode = 'sk'
export const AVAILABLE_LANGUAGES: Array<LanguageCode> = ['en', 'sk']

dayjs.extend(Duration)

loadCommonFonts()

loadEnvConfig(() => {
  const app = createApp(App)
    .use(i18n)
    .use(createPinia())
    .use(vuetify)
    .use(router)
    .use(AnzuSystemsCommonAdmin, {
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
  initErrorHandler(app)
  app.mount('#app')
})
