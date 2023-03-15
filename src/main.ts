import App from '@/App.vue'
import AppLayoutLoader from '@/layouts/AppLayoutLoader.vue'
import AppLayoutMain from '@/layouts/AppLayoutMain.vue'
import AppLayoutSidebar from '@/layouts/AppLayoutSidebar.vue'
import AppLayoutBlank from '@/layouts/AppLayoutBlank.vue'
import AppLayoutFullscreen from '@/layouts/AppLayoutFullscreen.vue'
import { vuetify } from '@/plugins/vuetify'
import { loadFonts } from '@/plugins/webfontloader'
import { router } from '@/router'
import { loadEnvConfig } from '@/services/EnvConfigService'
import { initErrorHandler } from '@/services/ErrorHandlerApiService'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { AnzuSystemsCommonAdmin, i18n, type PluginOptions } from '@anzusystems/common-admin'
import { useCurrentUser } from '@/composables/system/currentUser'
import type { AclValue } from '@/types/Permission'
import '@anzusystems/common-admin/styles'

const { currentUser } = useCurrentUser()

loadFonts()

loadEnvConfig(() => {
  const app = createApp(App)
    .use(i18n)
    .use(createPinia())
    .use(vuetify)
    .use(router)
    .use<PluginOptions<AclValue>>(AnzuSystemsCommonAdmin, {
      currentUser,
      languages: {
        available: ['en', 'sk'],
        default: 'en',
      },
    })
    .component('AppLayoutLoader', AppLayoutLoader)
    .component('AppLayoutMain', AppLayoutMain)
    .component('AppLayoutSidebar', AppLayoutSidebar)
    .component('AppLayoutBlank', AppLayoutBlank)
    .component('AppLayoutFullscreen', AppLayoutFullscreen)
  initErrorHandler(app)
  app.mount('#app')
})
