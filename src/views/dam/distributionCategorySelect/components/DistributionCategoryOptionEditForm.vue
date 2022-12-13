<script lang="ts" setup>
import ATextField from '@/components/form/ATextField.vue'
import { useDistributionCategoryOptionValidation } from '@/views/dam/distributionCategorySelect/composables/distributionCategoryOptionValidation'
import type { DistributionCategoryOption } from '@/types/dam/DistributionCategoryOption'
import { useVModel } from '@vueuse/core'
import { onMounted } from 'vue'
import ABooleanToggle from '@/components/form/ABooleanToggle.vue'
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

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VRow class="mt-5">
    <VCol cols="12" sm="5">
      <ATextField
        prepend-icon="mdi-drag"
        :v="v$.distributionCategoryOption.name"
        v-model="modelValue.name"
        data-cy="ext-system-name"
      ></ATextField>
    </VCol>
    <VCol cols="12" sm="1">
      <ABooleanToggle
        :label="t('coreDam.distributionCategorySelect.model.assignable')"
        v-model="modelValue.assignable"
      ></ABooleanToggle>
    </VCol>
    <VCol cols="12" sm="6">
      <ATextField
        append-icon="mdi-trash-can-outline"
        @click:append="emit('remove')"
        :v="v$.distributionCategoryOption.value"
        v-model="modelValue.value"
        data-cy="ext-system-name"
      ></ATextField>
    </VCol>
  </VRow>
</template>

<style lang="scss">
.v-input__prepend,
.v-input__prepend .v-icon.v-icon.v-icon--link {
  cursor: move;
}
</style>
