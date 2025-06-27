import path, { dirname } from 'path'
import { fileURLToPath, URL } from 'url'
import { defineConfig, type UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const _dirname = dirname(fileURLToPath(import.meta.url))
const shouldEnableSentry = !!process.env.APP_DEPLOY_ENV && !!process.env.SENTRY_URL

export default defineConfig({
  build: {
    sourcemap: shouldEnableSentry ? 'hidden' : false,
  },
  plugins: [
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
