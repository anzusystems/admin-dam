import { type ValidationScope } from '@anzusystems/common-admin'
import type {
  DistributionUpdateDto,
  JwDistributionUpdateDto,
  YoutubeDistributionUpdateDto,
} from '@/domains/coreDam/asset/types/Distribution'
import { DistributionUpdateDtoValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'

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
        url,
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
