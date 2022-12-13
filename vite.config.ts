import path, { dirname } from 'path'
import { fileURLToPath, URL } from 'url'
import { defineConfig, type UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

const _dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    {
      name: 'vitest-plugin-beforeall',
      config: () => ({
        test: { setupFiles: ['./vitest/beforeall.ts'] },
      }),
    },
    vue(),
    vuetify({
      autoImport: true,
      // styles: 'expose',
    }),
    VueI18nPlugin({
      globalSFCScope: true,
      include: path.resolve(_dirname, './src/locales/**'), // check for new syntax
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
  test: {
    globals: true,
    globalSetup: ['./vitest/setup.ts'],
    environment: 'jsdom',
    deps: {
      inline: ['vuetify'],
    },
    coverage: {
      all: true,
      extension: ['.vue'], // todo update c8 when merged https://github.com/bcoe/c8/pull/357
    },
  },
} as UserConfigExport)
