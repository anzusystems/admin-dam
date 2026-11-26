import type { DamAuthor, ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { computed } from 'vue'
import type { Ref } from 'vue'

import { useBadgeRules } from '@/domains/coreDam/assetLicence/composables/badgeValidation'

const { required, minLength, between } = useValidate()

export const PRIORITY_MAX = 100_000

export function useAuthorValidation(author: Ref<DamAuthor>, validationScope: ValidationScope = undefined) {
  const badgeRules = useBadgeRules()

  const rules = computed(() => ({
    author: {
      name: {
        required,
        minLength: minLength(2),
      },
      identifier: {
        minLength: minLength(2),
      },
      priority: {
        required,
        between: between(0, PRIORITY_MAX),
      },
      badge: badgeRules,
    },
  }))
  const v$ = useVuelidate(rules, { author }, { $scope: validationScope })

  return {
    v$,
  }
}
