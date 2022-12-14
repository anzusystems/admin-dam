import path, { dirname } from 'path'
import { fileURLToPath, URL } from 'url'
import { defineConfig, type UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { splitVendorChunkPlugin } from 'vite'

const _dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    splitVendorChunkPlugin(),
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
} as UserConfigExport)
