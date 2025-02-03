import { useValidate, type ValidationScope } from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'
import type { Ref } from 'vue'
import type {
  DistributionUpdateDto,
  JwDistributionUpdateDto, YoutubeDistributionUpdateDto
} from '@/types/coreDam/Distribution.ts'
import {
  DistributionUpdateDtoValidationScopeSymbol,
} from '@/components/validationScopes.ts'

export function useDistributionUpdateDtoValidations(distribution: Ref<DistributionUpdateDto>) {
  const { required } = useValidate()
  const rules = {
    distribution: {
      extId: {
        required,
      },
      status: {
        required,
      },
      assetFile: {
        required,
      },
    },
  }
  const v$ = useVuelidate(rules, { distribution }, { $scope: DistributionUpdateDtoValidationScopeSymbol })

  return {
    v$,
  }
}

export function useJwDistributionUpdateDtoValidations(
  distribution: Ref<JwDistributionUpdateDto>,
  validationScope?: ValidationScope
) {
  const { required, url } = useValidate()
  const rules = {
    distribution: {
      directSourceUrl: {
        required,
        url
      },
      distributionService: {
        required,
      },
    },
  }
  const v$ = useVuelidate(rules, { distribution }, { $scope: validationScope })

  return {
    v$,
  }
}

export function useYoutubeDistributionUpdateDtoValidations(
  distribution: Ref<YoutubeDistributionUpdateDto>,
  validationScope?: ValidationScope
) {
  const { required } = useValidate()
  const rules = {
    distribution: {
      distributionService: {
        required,
      },
    },
  }
  const v$ = useVuelidate(rules, { distribution }, { $scope: validationScope })

  return {
    v$,
  }
}

