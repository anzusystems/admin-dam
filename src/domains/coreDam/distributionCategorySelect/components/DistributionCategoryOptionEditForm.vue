<script lang="ts" setup>
import { AFormTextField } from '@anzusystems/common-admin'
import { useDistributionCategoryOptionValidation } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategoryOptionValidation'
import type { DistributionCategoryOption } from '@/domains/coreDam/distributionCategory/types/DistributionCategoryOption'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  {
    readonly: false,
  }
)

// Edited inline inside the ASortableListEditor #item slot; the editor owns drag + delete chrome.
const distributionCategoryOption = defineModel<DistributionCategoryOption>({ required: true })

const { v$ } = useDistributionCategoryOptionValidation(distributionCategoryOption)

const onBlur = () => {
  v$.value.$touch()
}

const { t } = useI18n()
</script>

<template>
  <VRow class="mt-2">
    <VCol
      cols="12"
      sm="6"
    >
      <AFormTextField
        v-model="distributionCategoryOption.name"
        :label="t('coreDam.distributionCategorySelect.model.name')"
        :v="v$.distributionCategoryOption.name"
        :readonly="readonly"
        data-cy="option-name"
        @blur="onBlur"
      />
    </VCol>
    <VCol
      cols="12"
      sm="6"
    >
      <AFormTextField
        v-model="distributionCategoryOption.value"
        :label="t('coreDam.distributionCategorySelect.model.value')"
        :v="v$.distributionCategoryOption.value"
        :readonly="readonly"
        data-cy="option-id"
        @blur="onBlur"
      />
    </VCol>
    <VCol
      cols="12"
      sm="6"
    >
      <VSwitch
        v-model="distributionCategoryOption.assignable"
        :label="t('coreDam.distributionCategorySelect.model.assignable')"
        :readonly="readonly"
        data-cy="option-assignable"
      />
    </VCol>
  </VRow>
</template>
