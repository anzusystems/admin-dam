import type { Options } from 'unplugin-auto-import/types'

// Shared by `vite.config.ts` and `vitest.config.ts`: the modules under test call these helpers at
// runtime, so the test build has to auto-import exactly the same list as the app build.
export const autoImports: Options['imports'] = [
  'vue',
  'vue-router',
  'pinia',
  {
    'vue-i18n': ['useI18n'],
    '@vuelidate/core': ['useVuelidate'],
    '@anzusystems/common-admin': [
      'isUndefined', 'isDefined', 'isNull', 'isString', 'isArray',
      'isInt', 'isNumber', 'isEmpty', 'isEmptyObject', 'isFunction',
      'dateTimeNow', 'dateTimeFriendly', 'cloneDeep', 'stringToInt',
      'stringToKebabCase', 'useAlerts', 'useValidate', 'defineBreadcrumbs',
      'defineCached', 'DATETIME_MAX', 'DATETIME_MIN', 'HTTP_STATUS_OK',
      'HTTP_STATUS_UNAUTHORIZED', 'SORT_BY_ID', 'useTheme',
    ],
  },
  {
    from: '@anzusystems/common-admin',
    imports: [
      'IntegerId', 'IntegerIdNullable', 'DocId', 'DocIdNullable', 'DatetimeUTC',
      'DatetimeUTCNullable', 'ValueObjectOption',
      'AnzuUserAndTimeTrackingAware', 'ResourceNameSystemAware', 'SortableItem',
    ],
    type: true,
  },
]
