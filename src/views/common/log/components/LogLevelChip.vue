<script lang="ts" setup>
import { computed } from 'vue'
import { LogLevel, useLogLevel } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    level: LogLevel
  }>(),
  {}
)

const { getLogLevelOption } = useLogLevel()
const levelOption = computed(() => {
  return getLogLevelOption(props.level)
})
</script>

<template>
  <VChip v-if="levelOption" :color="levelOption.color" label size="small">
    {{ levelOption.title }}
  </VChip>
</template>
