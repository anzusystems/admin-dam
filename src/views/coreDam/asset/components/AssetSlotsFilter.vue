<script lang="ts" setup>
import { AFilterValueObjectOptionsSelect, type Filter, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'

const props = withDefaults(
  defineProps<{
    modelValue: Filter
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: Filter): void
}>()

const value = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  },
})

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const items = computed(() => {
  return [
    ...configExtSystem.audio.slots,
    ...configExtSystem.image.slots,
    ...configExtSystem.video.slots,
    ...configExtSystem.document.slots,
  ]
    .filter((value, index, array) => array.indexOf(value) === index)
    .map((item) => ({ title: item, value: item }))
})

const { t } = useI18n()

const label = computed(() => {
  return props.modelValue.titleT ? t(props.modelValue.titleT) : undefined
})
</script>

<template>
  <AFilterValueObjectOptionsSelect
    v-model="value"
    :label="label"
    :items="items"
  />
</template>
