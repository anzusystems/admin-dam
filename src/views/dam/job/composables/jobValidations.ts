import { required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { Ref } from 'vue'
import { stringToInt } from '@anzusystems/common-admin'
import * as validators from '@vuelidate/validators'
import type { Job } from '@/types/dam/Job'
import { useI18n } from 'vue-i18n'
import type { JobResource } from '@/model/dam/valueObject/JobResource'

export function useJobValidation(job: Ref<Job>) {
  const { t } = useI18n()
  const withI18nMessage = validators.createI18nMessage({ t })

  const jobTargetUser = withI18nMessage(
    (
      value: string,
      siblings: {
        _resourceName: JobResource
      }
    ): boolean => {
      if (siblings._resourceName === 'jobUserDataDelete') {
        return stringToInt(value) > 0
      }

      return true
    },
    {
      messagePath: () => 'validations.between',
    }
  )

  const rules = {
    job: {
      _resourceName: {
        required,
      },
      targetUserId: {
        jobTargetUser,
      },
    },
  }

  const v$ = useVuelidate(rules, { job })

  return {
    v$,
  }
}
