<script lang="ts" setup>
import { computed, ref } from 'vue'
// import { useI18n } from 'vue-i18n'
import { clickBlur } from '@/utils/event'

// const { t } = useI18n({ useScope: 'global' })

withDefaults(
  defineProps<{
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonClass: 'mt-1',
    dataCy: 'filter-advanced',
  }
)
const emit = defineEmits<{
  (e: 'advancedFilter'): void
}>()

const active = ref(false)

const onClick = (event: Event) => {
  clickBlur(event)
  active.value = !active.value
  emit('advancedFilter')
}

const icon = computed(() => {
  return active.value ? 'mdi-chevron-double-up' : 'mdi-chevron-double-down'
})
</script>

<template>
  <VBtn :class="buttonClass" :data-cy="dataCy" icon size="x-small" variant="text" @click.stop="onClick">
    <VIcon :icon="icon" />
  </VBtn>
</template>
