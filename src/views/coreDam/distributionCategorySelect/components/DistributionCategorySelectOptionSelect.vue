<script lang="ts" setup>
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import { useVModel } from '@vueuse/core'
import { computed } from 'vue'
import type { ErrorObject } from '@vuelidate/core'
import { useVuelidate } from '@vuelidate/core'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { useValidate } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    modelValue: DistributionCategoryOption | null | undefined
    select: DistributionCategorySelect
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'update:modelValue', data: DistributionCategoryOption | null | undefined): void
  (e: 'blur', data: DistributionCategoryOption | null | undefined): void
}>()

const modelValue = useVModel(props, 'modelValue', emit)

const isRequired = (): boolean =>
  damConfigExtSystem[props.select.type].distribution.distributionRequirements[props.select.serviceSlug]?.categorySelect
    ?.required ?? false

const { required } = useValidate()

const v$ = useVuelidate({ modelValue: isRequired() ? { required } : {} }, { modelValue })

const requiredComputed = computed(() => {
  return v$.value.modelValue.required && v$.value.modelValue.required.$params.type === 'required'
})

const errorMessageComputed = computed(() => {
  if (v$.value.$errors?.length) return [v$.value.$errors.map((item: ErrorObject) => item.$message).join(' ')]
  return []
})

const onBlur = () => {
  emit('blur', modelValue.value)
  v$.value.$touch()
}
</script>

<template>
  <VSelect
    v-model="modelValue"
    :items="select.options"
    item-title="name"
    item-value="id"
    :label="select.serviceSlug"
    return-object
    clearable
    no-filter
    :error-messages="errorMessageComputed"
    data-cy="distribution-category-select"
    @blur="onBlur"
  >
    <template #label>
      <span>{{ select.serviceSlug }}</span>
      <span v-if="requiredComputed" class="required" />
    </template>
  </VSelect>
</template>
