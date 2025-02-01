<script lang="ts" setup>
import {
  AFormTextField, AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope, useDamConfigStore,
} from '@anzusystems/common-admin'
import { SYSTEM_DAM } from '@/model/systems.ts'
import {
  type DistributionItem,
  DistributionItemResourceName,
  type DistributionJwItem
} from '@/types/coreDam/Distribution.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AssetDetailSlotSelect from '@/views/coreDam/asset/detail/components/AssetDetailSlotSelect.vue'
import type { AssetSlot } from '@/types/coreDam/AssetSlot.ts'
import { useDistributionStatus } from '@/model/coreDam/valueObject/DamDistributionStatus.ts'
import {
  useJwDistributionUpdateDtoValidations
} from '@/views/coreDam/asset/detail/composables/distributionValidations.ts'

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
    .filter(([key, value]) => value.type === DistributionItemResourceName.Jw)
    .map(([key, value]) => {
    return {
      title: value.title,
      value: key,
    }
  })
})

const distribution = defineModel<DistributionJwItem>({ required: true })

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
      :label="t('coreDam.jwDistribution.model.distributionService')"
      v-model="distribution.distributionService"
      :items="distributionServices"
      :readonly="readonly"
      :v="v$.distribution.distributionService"
    />
  </ARow>
  <ARow>
    <AFormTextField
      :label="t('coreDam.jwDistribution.model.directSourceUrl')"
      v-model="distribution.directSourceUrl"
      @blur="onBlur"
      :readonly="readonly"
      :v="v$.distribution.directSourceUrl"
    />
  </ARow>
</template>
