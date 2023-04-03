<script lang="ts" setup>
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import { computed } from 'vue'
import type { ErrorObject } from '@vuelidate/core'
import { useVuelidate } from '@vuelidate/core'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { cloneDeep, useValidate } from '@anzusystems/common-admin'

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

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: DistributionCategoryOption | null | undefined) {
    emit('update:modelValue', cloneDeep<DistributionCategoryOption | null | undefined>(newValue))
  },
})

const isRequired = (): boolean =>
  damConfigExtSystem[props.select.type].distribution.distributionRequirements[props.select.serviceSlug]?.categorySelect
    ?.required ?? false

const { required } = useValidate()

// @ts-ignore
const v$ = useVuelidate({ modelValue: isRequired() ? { required } : {} }, { modelValueComputed })

const requiredComputed = computed(() => {
  return v$.value.modelValue.required && v$.value.modelValue.required.$params.type === 'required'
})

const errorMessageComputed = computed(() => {
  if (v$.value.$errors?.length) return [v$.value.$errors.map((item: ErrorObject) => item.$message).join(' ')]
  return []
})

const onBlur = () => {
  emit('blur', modelValueComputed.value)
  v$.value.$touch()
}
</script>

<template>
  <VSelect
    v-model="modelValueComputed"
    :items="select.options"
    item-title="name"
    item-value="id"
    :label="select.serviceSlug"
    clearable
    no-filter
    :error-messages="errorMessageComputed"
    data-cy="distribution-category-select"
    @blur="onBlur"
  >
    <template #label>
      <span>{{ select.serviceSlug }}</span>
      <span
        v-if="requiredComputed"
        class="required"
      />
    </template>
  </VSelect>
</template>
