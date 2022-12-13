<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { splitOnFirstOccurrence } from '@/utils/string'
import type { ValueObjectOption } from '@/types/ValueObject'
import type { ErrorObject } from '@vuelidate/core'
import { isNull, isUndefined } from '@/utils/common'
import { SubjectScopeSymbol, SystemScopeSymbol } from '@/components/injectionKeys'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | string[] | number[] | any // any is temp fix for vuetify
    items: ValueObjectOption<string | number>[] | any // any is temp fix for vuetify
    label?: string | null
    errorMessage?: string | null
    required?: boolean | null
    v?: any
    hideLabel?: boolean
    multiple?: boolean
    hideDetails?: boolean
    clearable?: boolean
    dataCy?: string
  }>(),
  {
    label: null,
    errorMessage: null,
    required: null,
    v: null,
    hideLabel: false,
    multiple: false,
    hideDetails: false,
    clearable: false,
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | number | string[] | number[]): void
  (e: 'blur', data: string | number | string[] | number[]): void
}>()
const { modelValue } = useVModels(props, emit)

const system = inject<string>(SystemScopeSymbol)
const subject = inject<string>(SubjectScopeSymbol)

const { t } = useI18n({ useScope: 'global' })

const onBlur = () => {
  emit('blur', props.modelValue)
  props.v?.$touch()
}

const errorMessageComputed = computed(() => {
  if (!isNull(props.errorMessage)) return [props.errorMessage]
  if (props.v?.$errors?.length) return props.v.$errors.map((item: ErrorObject) => item.$message)
  return []
})

const labelComputed = computed(() => {
  if (!isNull(props.label)) return props.label
  if (isUndefined(system) || isUndefined(subject) || isUndefined(props.v?.$path)) return ''
  if (system.length === 0 || subject.length === 0) return ''
  const { end: path } = splitOnFirstOccurrence(props.v?.$path, '.')
  return t(system + '.' + subject + '.model.' + path)
})

const requiredComputed = computed(() => {
  if (!isNull(props.required)) return props.required
  if (props.v?.required && props.v?.required.$params.type === 'required') return true
  return false
})
</script>

<template>
  <VAutocomplete
    v-model="modelValue"
    :items="items"
    item-title="title"
    item-value="value"
    :multiple="multiple"
    :clearable="clearable"
    @blur="onBlur"
    :error-messages="errorMessageComputed"
    :data-cy="dataCy"
  >
    <template #label>
      <span v-if="!hideLabel">{{ labelComputed }}<span v-if="requiredComputed" class="required"></span> </span>
    </template>
  </VAutocomplete>
</template>
