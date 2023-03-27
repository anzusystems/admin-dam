import apiValidation from '@/locales/sk/error/apiValidation.json'
import apiForbiddenOperation from '@/locales/sk/error/apiForbiddenOperation.json'
import jsValidation from '@/locales/sk/error/jsValidation.json'
import { messagesSk } from '@anzusystems/common-admin'
import sidebar from '@/locales/sk/sidebar.json'

export default {
  ...messagesSk,
  sidebar,
  ...{
    error: {
      apiValidation: {
        ...messagesSk.error.apiValidation,
        ...apiValidation,
      },
      apiForbiddenOperation: {
        ...messagesSk.error.apiForbiddenOperation,
        ...apiForbiddenOperation,
      },
      jsValidation: {
        ...messagesSk.error.jsValidation,
        ...jsValidation,
      },
    },
  },
}
