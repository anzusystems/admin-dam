<script lang="ts" setup>
withDefaults(
  defineProps<{
    routeName: string
    buttonT?: string
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonT: 'common.button.close',
    buttonClass: 'ml-2',
    dataCy: 'button-close',
  }
)
</script>

<template>
  <VBtn
    :class="buttonClass"
    :data-cy="dataCy"
    :to="{ name: routeName }"
    icon="mdi-close"
    size="small"
    variant="outlined"
    :width="36"
    :height="36"
  ></VBtn>
</template>
