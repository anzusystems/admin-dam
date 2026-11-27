<script lang="ts" setup>
import { AActionbar } from '@anzusystems/common-admin'
import type { Breadcrumbs } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    breadcrumbs?: Breadcrumbs | undefined
  }>(),
  {
    breadcrumbs: undefined,
  }
)
</script>

<template>
  <AActionbar :breadcrumbs="breadcrumbs">
    <template
      v-if="$slots.breadcrumbs"
      #breadcrumbs
    >
      <slot name="breadcrumbs" />
    </template>
    <template #buttons>
      <slot name="buttons" />
    </template>
  </AActionbar>
</template>
