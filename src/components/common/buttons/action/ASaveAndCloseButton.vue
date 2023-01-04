<script lang="ts" setup>
import AIconGroup from '@/components/common/AIconGroup.vue'
import { clickBlur } from '@/utils/event'
import ABtn from '@/components/common/buttons/ABtn.vue'

withDefaults(
  defineProps<{
    buttonT?: string
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonT: 'common.button.saveAndClose',
    buttonClass: 'ml-2',
    dataCy: 'button-save-close',
  }
)
const emit = defineEmits<{
  (e: 'saveRecordAndClose'): void
}>()

const onClick = (event: Event) => {
  clickBlur(event)
  emit('saveRecordAndClose')
}
</script>

<template>
  <ABtn
    :class="buttonClass"
    :data-cy="dataCy"
    btn-helper="saveAndClose"
    color="primary"
    icon=""
    variant="outlined"
    @click.stop="onClick"
    :width="36"
    :height="35"
  >
    <AIconGroup main-icon="mdi-content-save" secondary-icon="mdi-close"></AIconGroup>
    <VTooltip activator="parent" location="bottom">Save and close</VTooltip>
  </ABtn>
</template>
