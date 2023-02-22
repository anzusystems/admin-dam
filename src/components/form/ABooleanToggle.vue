<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean | null
    mandatory?: boolean
    label?: string
    dataCy?: string
  }>(),
  {
    modelValue: null,
    mandatory: false,
    label: undefined,
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: boolean | null): void
}>()

const value = computed({
  get() {
    return props.modelValue
  },
  set(newValue: boolean | null) {
    emit('update:modelValue', newValue)
  },
})

const { t } = useI18n()
</script>
<template>
  <VLabel v-if="label" class="pr-1">{{ label }}</VLabel>
  <VBtnToggle v-model="value" :mandatory="mandatory">
    <VBtn :value="true" data-cy="toggle-true">{{ t('common.boolean.true') }}</VBtn>
    <VBtn :value="false" data-cy="toggle-false">{{ t('common.boolean.false') }}</VBtn>
  </VBtnToggle>
</template>
