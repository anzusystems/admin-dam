<script lang="ts" setup>
import { rotateImage } from '@/services/api/coreDam/imageApi'
import type { DocId } from '@anzusystems/common-admin'
import { useAlerts, useErrorHandler } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    imageId: DocId
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'afterRotate'): void
}>()

const { handleError } = useErrorHandler()
const { showRecordWas } = useAlerts()

const loading = ref(false)

const rotate = async (angle: 90 | 270) => {
  try {
    loading.value = true
    await rotateImage(props.imageId, angle)
    showRecordWas('updated')
    emit('afterRotate')
  } catch (e) {
    handleError(e)
  } finally {
    loading.value = false
  }
}
const { t } = useI18n()
</script>

<template>
  <div>
    <div class="text-caption">{{ t('coreDam.asset.detail.roi.rotate.rotateMainFileImage') }}</div>
    <div v-if="loading" class="w-100 d-flex align-center justify-center">
      <VProgressCircular indeterminate color="primary" />
    </div>
    <div v-else>
      <VBtn variant="flat" prepend-icon="mdi-rotate-right" color="secondary" class="mr-2" @click.stop="rotate(90)">
        {{ t('coreDam.asset.detail.roi.rotate.rotateClockwise') }}
      </VBtn>
      <VBtn variant="flat" prepend-icon="mdi-rotate-left" color="secondary" @click.stop="rotate(270)">
        {{ t('coreDam.asset.detail.roi.rotate.rotateCounterclockwise') }}
      </VBtn>
    </div>
  </div>
</template>
