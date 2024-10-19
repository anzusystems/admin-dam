<script lang="ts" setup>
import { AFilterValueObjectOptionsSelect, type Filter, useDamConfigStore } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue: Filter
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
}>()

const value = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  },
})
const damConfigStore = useDamConfigStore()

const items = computed(() => {
  return Object.entries(damConfigStore.damPrvConfig.distributionServices).map(([key, value]) => {
    return {
      title: value.title,
      value: key,
    }
  })
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
