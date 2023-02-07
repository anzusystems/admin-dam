<script lang="ts" setup>
import { useVModel } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    modelValue?: string[] | number[] | string | number | null | any // any is temp fix for vuetify
    multiple?: boolean
    readonly?: boolean
    closableChips?: boolean
    label?: string
    dataCy?: string
  }>(),
  {
    modelValue: null,
    multiple: false,
    readonly: false,
    closableChips: false,
    label: undefined,
    dataCy: '',
  }
)

const modelValue = useVModel(props, 'modelValue')
</script>

<template>
  <VCombobox
    v-model="modelValue"
    :label="label"
    :readonly="readonly"
    multiple
    chips
    :closable-chips="closableChips"
    no-filter
    :data-cy="dataCy"
  />
</template>
