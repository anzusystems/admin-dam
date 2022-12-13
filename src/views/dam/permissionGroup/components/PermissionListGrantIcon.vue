<script lang="ts" setup>
import type { ValueObjectOption } from '@/types/ValueObject'
import type { Grant } from '@/types/Permission'

defineProps<{
  value: ValueObjectOption<Grant>
}>()
</script>

<template>
  <div v-if="value.icon">
    <VTooltip location="bottom">
      <template #activator="{ props }">
        <VIcon :color="value.color" v-bind="props" :icon="value.icon" />
      </template>
      <span>{{ value.title }}</span>
    </VTooltip>
  </div>
</template>
