<script lang="ts" setup>
withDefaults(
  defineProps<{
    title?: string
    value?: string | number | null
    dataCy?: string
  }>(),
  {
    title: '',
    value: '',
    dataCy: '',
  }
)
</script>

<template>
  <VRow>
    <VCol :data-cy="dataCy">
      <h4 v-if="title.length" class="text-subtitle-2">{{ title }}</h4>
      <slot>
        <span class="text-high-emphasis">{{ value }}</span>
      </slot>
    </VCol>
  </VRow>
</template>
