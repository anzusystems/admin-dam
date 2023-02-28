import localValidationJs from '@/locales/sk/validation/js.json'
import localValidationApi from '@/locales/sk/validation/api.json'
import { messagesSk } from '@anzusystems/common-admin'
import sidebar from '@/locales/sk/sidebar.json'

export default {
  ...messagesSk,
  sidebar,
  ...{
    validations: {
      api: {
        ...messagesSk.validations.api,
        ...localValidationApi,
      },
      js: {
        ...messagesSk.validations.js,
        ...localValidationJs,
      },
    },
  },
}
