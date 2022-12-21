<script lang="ts" setup>
import type { DistributionCategorySelect } from '@/types/dam/DistributionCategorySelect'
import type { DistributionCategoryOption } from '@/types/dam/DistributionCategoryOption'
import { useVModel } from '@vueuse/core'
import { computed } from 'vue'
import type { ErrorObject } from '@vuelidate/core'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@/plugins/validators'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'

const props = withDefaults(
  defineProps<{
    modelValue: DistributionCategoryOption | null
    select: DistributionCategorySelect
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'update:modelValue', data: DistributionCategoryOption | null): void
  (e: 'blur', data: DistributionCategoryOption | null): void
}>()

const modelValue = useVModel(props, 'modelValue', emit)

const isRequired = (): boolean =>
  damConfigExtSystem[props.select.type].distribution.distributionRequirements[props.select.serviceSlug]?.categorySelect
    ?.required ?? false

const v$ = useVuelidate({ modelValue: isRequired() ? { required } : {} }, { modelValue })

const requiredComputed = computed(() => {
  return v$.value.modelValue.required && v$.value.modelValue.required.$params.type === 'required'
})

const errorMessageComputed = computed(() => {
  if (v$.value.$errors?.length) return v$.value.$errors.map((item: ErrorObject) => item.$message)
  return []
})

const onBlur = () => {
  emit('blur', modelValue.value)
  v$.value.$touch()
}
</script>

<template>
  <VSelect
    :items="select.options"
    v-model="modelValue"
    item-title="name"
    item-value="id"
    :label="select.serviceSlug"
    return-object
    clearable
    no-filter
    :error-messages="errorMessageComputed"
    @blur="onBlur"
    data-cy="distribution-category-select"
  >
    <template #label>
      <span>{{ select.serviceSlug }}</span>
      <span v-if="requiredComputed" class="required"></span>
    </template>
  </VSelect>
</template>
