import { useValidate } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { computed } from 'vue'
import type { Ref } from 'vue'

import type { ExtSystem } from '@/domains/coreDam/extSystem/types/ExtSystem'

const { required, minLength, slug } = useValidate()

export function useExtSystemValidation(extSystem: Ref<ExtSystem>) {
  const rules = computed(() => ({
    extSystem: {
      name: {
        required,
        minLength: minLength(2),
      },
      slug: {
        required,
        slug,
      },
    },
  }))
  const v$ = useVuelidate(rules, { extSystem })

  return {
    v$,
  }
}
