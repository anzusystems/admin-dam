import App from '@/App.vue'
import AppLayoutLoader from '@/layouts/AppLayoutLoader.vue'
import AppLayoutMain from '@/layouts/AppLayoutMain.vue'
import AppLayoutDrawer from '@/layouts/AppLayoutDrawer.vue'
import AppLayoutBlank from '@/layouts/AppLayoutBlank.vue'
import AppLayoutFullscreen from '@/layouts/AppLayoutFullscreen.vue'
import { vuetify } from '@/plugins/vuetify'
import { router } from '@/router'
import { loadEnvConfig } from '@/services/EnvConfigService'
import { initErrorHandler } from '@/services/ErrorHandlerApiService'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import {
  AnzuSystemsCommonAdmin,
  i18n,
  type LanguageCode,
  loadCommonFonts,
  type PluginOptions,
} from '@anzusystems/common-admin'
import { useCurrentUser } from '@/composables/system/currentUser'
import type { AclValue } from '@/types/Permission'
import '@anzusystems/common-admin/styles'
import { damClient } from '@/services/api/clients/damClient'

export const DEFAULT_LANGUAGE: LanguageCode = 'sk'
export const AVAILABLE_LANGUAGES: Array<LanguageCode> = ['en', 'sk']

const { currentUser } = useCurrentUser()

loadCommonFonts()

loadEnvConfig(() => {
  const app = createApp(App)
    .use(i18n)
    .use(createPinia())
    .use(vuetify)
    .use(router)
    .use<PluginOptions<AclValue>>(AnzuSystemsCommonAdmin, {
      currentUser,
      languages: {
        available: AVAILABLE_LANGUAGES,
        default: DEFAULT_LANGUAGE,
      },
      coreDam: {
        client: damClient,
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
