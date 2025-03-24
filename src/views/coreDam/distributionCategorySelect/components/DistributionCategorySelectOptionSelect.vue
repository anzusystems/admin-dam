<script lang="ts" setup>
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import { computed } from 'vue'
import type { ErrorObject } from '@vuelidate/core'
import { useVuelidate } from '@vuelidate/core'
import { cloneDeep, isUndefined, useDamConfigState, useValidate } from '@anzusystems/common-admin'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'

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

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const isRequired = computed(() => {
  return (
    configExtSystem[props.select.type].distribution.distributionRequirements[props.select.serviceSlug]?.categorySelect
      ?.required ?? false
  )
})

const { requiredIf } = useValidate()

// eslint-disable-next-line vue/no-ref-object-reactivity-loss
const v$ = useVuelidate({ modelValueComputed: { required: requiredIf(isRequired.value) } }, { modelValueComputed })

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
    return-object
    @blur="onBlur"
  >
    <template #label>
      <span>{{ select.serviceSlug }}</span>
      <span
        v-if="isRequired"
        class="required"
      />
    </template>
  </VSelect>
</template>
