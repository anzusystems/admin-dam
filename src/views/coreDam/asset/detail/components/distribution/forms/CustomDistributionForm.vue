<script lang="ts" setup>
import type { ValidationScope } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    readonly?: boolean,
    validationScope?: ValidationScope
  }>(),
  {
    readonly: false,
    validationScope: undefined,
  }
)

</script>

<template>
  <div />
</template>
