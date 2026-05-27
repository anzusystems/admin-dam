import path, { dirname } from 'path'
import { fileURLToPath, URL } from 'url'
import { defineConfig, type UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import vuetify from 'vite-plugin-vuetify'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'

const _dirname = dirname(fileURLToPath(import.meta.url))
const shouldEnableSentry = !!process.env.APP_DEPLOY_ENV && !!process.env.SENTRY_URL

export default defineConfig({
  build: {
    sourcemap: shouldEnableSentry ? 'hidden' : false,
    target: 'es2019',
    cssMinify: 'lightningcss',
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist('supports css-cascade-layers')),
    },
  },
  plugins: [
    VueRouter({
      routesFolder: 'src/pages',
      dts: false,
      importMode: process.env.NODE_ENV === 'production' ? 'async' : 'sync',
      getRouteName: (node) => {
        let name = ''
        let current = node
        while (current.parent) {
          const segment = current.value.rawSegment === 'index' ? '' : current.value.rawSegment
          if (segment) {
            name = '/' + segment + name
          }
          current = current.parent
        }
        return name || '/'
      },
    }),
    vue(),
    vuetify({
      autoImport: true,
    }),
    VueI18nPlugin({
      runtimeOnly: false,
      globalSFCScope: true,
      include: path.resolve(_dirname, './src/locales/**.json'),
    }),
    sentryVitePlugin({
      disable: !shouldEnableSentry,
      url: process.env.SENTRY_URL,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: 'petitpress',
      project: 'anzu-admin-dam',
      release: { name: process.env.GITVAR_SHORTVERSION },
      telemetry: false,
      sourcemaps: {
        filesToDeleteAfterUpload: './dist/**/*.js.map',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  preview: {
    port: 8172,
  },
} as UserConfigExport)
