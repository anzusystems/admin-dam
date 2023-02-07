<script lang="ts" setup>
import { computed, inject } from 'vue'
import { splitOnFirstOccurrence } from '@/utils/string'
import { useI18n } from 'vue-i18n'
import type { ErrorObject } from '@vuelidate/core'
import { isNull, isUndefined } from '@/utils/common'
import { SubjectScopeSymbol, SystemScopeSymbol } from '@/components/injectionKeys'
import type { IconValue } from '@/types/Vuetify'

const { t } = useI18n({ useScope: 'global' })

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null // todo number emit and remove null
    label?: string | null
    errorMessage?: string | null
    required?: boolean | null
    v?: any
    prependIcon?: IconValue
    appendIcon?: IconValue
    dataCy?: string
    hideLabel?: boolean
    rows?: number
  }>(),
  {
    label: null,
    errorMessage: null,
    required: null,
    v: null,
    prependIcon: undefined,
    appendIcon: undefined,
    dataCy: '',
    hideLabel: false,
    rows: 1,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: string | number | null): void
  (e: 'click:append', data: string | number | null): void
  (e: 'blur', data: string | number | null): void
}>()

const system = inject<string>(SystemScopeSymbol)
const subject = inject<string>(SubjectScopeSymbol)

const onUpdate = (newValue: number | string) => {
  emit('update:modelValue', newValue)
}
const onBlur = () => {
  emit('blur', props.modelValue)
  props.v?.$touch()
}

const errorMessageComputed = computed(() => {
  if (!isNull(props.errorMessage)) return [props.errorMessage]
  if (props.v?.$errors?.length) return [props.v.$errors.map((item: ErrorObject) => item.$message).join(' ')]
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
  <VTextarea
    :prepend-icon="prependIcon"
    :data-cy="dataCy"
    :error-messages="errorMessageComputed"
    :model-value="modelValue"
    :required="requiredComputed"
    :rows="rows"
    auto-grow
    :append-icon="appendIcon"
    trim
    @click:append="(event) => emit('click:append', event)"
    @blur="onBlur"
    @update:model-value="onUpdate($event)"
  >
    <template v-if="!hideLabel" #label> {{ labelComputed }}<span v-if="requiredComputed" class="required" /> </template>
  </VTextarea>
</template>
