<script lang="ts" setup>
import { clickBlur } from '@/utils/event'

withDefaults(
  defineProps<{
    tooltipT?: string
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    tooltipT: 'common.button.resetFilter',
    buttonClass: 'ml-2',
    dataCy: 'filter-reset',
  }
)
const emit = defineEmits<{
  (e: 'reset'): void
}>()

const onClick = (event: Event) => {
  clickBlur(event)
  emit('reset')
}
</script>

<template>
  <VBtn
    :class="buttonClass"
    class="px-2"
    :data-cy="dataCy"
    color="light"
    min-width="36px"
    @click.stop="onClick"
    variant="flat"
  >
    <VIcon color="grey darken-1" icon="mdi-filter-remove-outline" />
  </VBtn>
</template>
