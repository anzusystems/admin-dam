<script lang="ts" setup>
import { clickBlur } from '@/utils/event'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    buttonT?: string
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonT: 'common.button.submitFilter',
    buttonClass: '',
    dataCy: 'filter-submit',
  }
)
const emit = defineEmits<{
  (e: 'submit'): void
}>()

const onClick = (event: Event) => {
  clickBlur(event)
  emit('submit')
}

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VBtn :class="buttonClass" :data-cy="dataCy" color="success" type="submit" @click.stop="onClick" elevation="0">
    {{ t(buttonT) }}
  </VBtn>
</template>
