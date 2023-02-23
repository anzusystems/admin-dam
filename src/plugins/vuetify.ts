import '@mdi/font/scss/materialdesignicons.scss'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { Intersect } from 'vuetify/directives'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { i18n } from '@/plugins/i18n'
import { useI18n } from 'vue-i18n'

export const vuetify = createVuetify({
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  directives: { Intersect },
  theme: {
    defaultTheme: 'light',
    variations: {
      colors: [],
      lighten: 0,
      darken: 0,
    },
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#ffffff',
          surface: '#ffffff',
          'on-surface': '#333',
          primary: '#3f6ad8',
          secondary: '#E0E0E0',
          'on-secondary': '#333',
          success: '#3ac47d',
          'on-success': '#fff',
          warning: '#FB8C00',
          error: '#d92550',
          info: '#78c3fb',
          'primary-darken-1': '#3700B3',
          'secondary-darken-1': '#333',
        },
        variables: {},
      },
      dark: {
        dark: true,
        colors: {
          background: '#1A1A1A',
          surface: '#1A1A1A',
          primary: '#3f6ad8',
          secondary: '#E0E0E0',
          'on-secondary': '#333',
          success: '#3ac47d',
          warning: '#FB8C00',
          error: '#d92550',
          info: '#78c3fb',
          'primary-darken-1': '#3700B3',
          'secondary-darken-1': '#03DAC5',
        },
        variables: {},
      },
    },
  },
  defaults: {
    global: {},
    VBtn: {},
    VRow: {
      dense: true,
    },
    VTextField: {
      variant: 'underlined',
      density: 'compact',
      color: 'primary',
    },
    VTextarea: {
      variant: 'underlined',
      density: 'compact',
      color: 'primary',
    },
    VSelect: {
      variant: 'underlined',
      density: 'compact',
      color: 'primary',
    },
    VAutocomplete: {
      variant: 'underlined',
      density: 'compact',
      color: 'primary',
    },
    VCombobox: {
      variant: 'underlined',
      density: 'compact',
      color: 'primary',
    },
    VSwitch: {
      color: 'success',
    },
  },
}) as any // todo: temp ts fix
