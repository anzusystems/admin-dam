import localValidationJs from '@/locales/sk/validation/js.json'
import localValidationApi from '@/locales/sk/validation/api.json'
import { commonAdminAllMessages } from '@anzusystems/common-admin'
import sidebar from '@/locales/sk/sidebar.json'

export const sk = {
  ...commonAdminAllMessages.sk,
  sidebar,
  ...{
    validations: {
      api: {
        ...commonAdminAllMessages.sk.validations.api,
        ...localValidationApi,
      },
      js: {
        ...commonAdminAllMessages.sk.validations.js,
        ...localValidationJs,
      },
    },
  },
}
