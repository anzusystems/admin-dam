<script lang="ts" setup>
import {
  AFormTextField, AFormValueObjectOptionsSelect,
  ARow,
  type ValidationScope, useDamConfigStore,
} from '@anzusystems/common-admin'
import {
  DistributionItemResourceName,
  type JwDistributionUpdateDto
} from '@/types/coreDam/Distribution'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useJwDistributionUpdateDtoValidations
} from '@/views/coreDam/asset/detail/composables/distributionValidations'

const props = withDefaults(
  defineProps<{
    readonly?: boolean,
    validationScope?: ValidationScope
  }>(),
  {
    readonly: false,
    validationScope: undefined,
  }
)

const damConfigStore = useDamConfigStore()

const distributionServices = computed(() => {
  return Object.entries(damConfigStore.damPrvConfig.distributionServices)
    .filter(([, value]) => value.type === DistributionItemResourceName.Jw)
    .map(([key, value]) => {
    return {
      title: value.title,
      value: key,
    }
  })
})

const distribution = defineModel<JwDistributionUpdateDto>({ required: true })

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { v$ } = useJwDistributionUpdateDtoValidations(distribution, props.validationScope)

const { t } = useI18n()

const onBlur = () => {
  v$.value.$touch()
}

</script>

<template>
  <ARow>
    <AFormValueObjectOptionsSelect
      v-model="distribution.distributionService"
      :label="t('coreDam.jwDistribution.model.distributionService')"
      :items="distributionServices"
      :readonly="readonly"
      :v="v$.distribution.distributionService"
    />
  </ARow>
  <ARow>
    <AFormTextField
      v-model="distribution.directSourceUrl"
      :label="t('coreDam.jwDistribution.model.directSourceUrl')"
      :readonly="readonly"
      :v="v$.distribution.directSourceUrl"
      @blur="onBlur"
    />
  </ARow>
</template>
