import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { ExtSystem } from '@/types/coreDam/ExtSystem'
import { useValidateMinLength, useValidateRequired, useValidateSlug } from '@anzusystems/common-admin'

const required = useValidateRequired()
const minLength = useValidateMinLength()
const slug = useValidateSlug()

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
