<script lang="ts" setup>
import { AFormBooleanToggle, AFormTextField } from '@anzusystems/common-admin'
import {
  useDistributionCategoryOptionValidation
} from '@/views/coreDam/distributionCategorySelect/composables/distributionCategoryOptionValidation'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import { useVModel } from '@vueuse/core'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue: DistributionCategoryOption
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'update:modelValue', data: DistributionCategoryOption): void
  (e: 'remove'): void
}>()

const modelValue = useVModel(props, 'modelValue', emit)

const { v$ } = useDistributionCategoryOptionValidation(modelValue)

onMounted(() => {
  v$.value.$touch()
})

const { t } = useI18n()
</script>

<template>
  <VRow class="mt-5">
    <VCol cols="12" sm="5">
      <AFormTextField
        v-model="modelValue.name"
        prepend-icon="mdi-drag"
        :v="v$.distributionCategoryOption.name"
        data-cy="ext-system-name"
      />
    </VCol>
    <VCol cols="12" sm="1">
      <AFormBooleanToggle
        v-model="modelValue.assignable"
        :label="t('coreDam.distributionCategorySelect.model.assignable')"
      />
    </VCol>
    <VCol cols="12" sm="6">
      <AFormTextField
        v-model="modelValue.value"
        append-icon="mdi-trash-can-outline"
        :v="v$.distributionCategoryOption.value"
        data-cy="ext-system-name"
        @click:append="emit('remove')"
      />
    </VCol>
  </VRow>
</template>

<style lang="scss">
.v-input__prepend,
.v-input__prepend .v-icon.v-icon.v-icon--link {
  cursor: move;
}
</style>
