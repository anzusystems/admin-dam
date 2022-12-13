<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const props = withDefaults(
  defineProps<{
    value: number | string | boolean
    chip?: boolean
  }>(),
  {
    chip: false,
  }
)

const booleanValue = computed(() => {
  return props.value === true || props.value === 1 || props.value === 'true'
})

const text = computed(() => {
  if (booleanValue.value) {
    return t('common.boolean.true')
  }
  return t('common.boolean.false')
})
</script>

<template>
  <VChip v-if="chip" :color="booleanValue ? 'success' : 'error'" label size="small">{{ text }}</VChip>
  <span v-else>{{ text }}</span>
</template>
