<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean
    size?: string
    color?: string
    dataCy?: string
  }>(),
  {
    active: false,
    size: 'x-small',
    color: 'primary',
    dataCy: 'loader',
  }
)
</script>

<template>
  <VProgressCircular
    v-if="active"
    indeterminate
    :data-cy="dataCy"
    :color="color"
    :size="size"
    :width="2"
  ></VProgressCircular>
</template>
