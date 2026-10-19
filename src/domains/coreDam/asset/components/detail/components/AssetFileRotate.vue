<script lang="ts" setup>
import { useAlerts } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { rotateImage } from '@/domains/coreDam/asset/api/imageApi'

const props = withDefaults(
  defineProps<{
    imageId: DocId
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)
const emit = defineEmits<{
  (e: 'afterRotate', imageId: DocId): void
}>()

const { showRecordWas, showErrorsDefault, showUnknownError } = useAlerts()

const loading = ref(false)

// The file pressed for: another one can be shown by the time the server answers.
const rotate = async (angle: 90 | 270) => {
  const imageId = props.imageId
  try {
    loading.value = true
    await rotateImage(imageId, angle)
    showRecordWas('updated')
    emit('afterRotate', imageId)
  } catch (e) {
    // The request rejects with what axios threw, or with nothing at all: neither is an error the alerts know.
    if (!showErrorsDefault(e)) showUnknownError()
  } finally {
    loading.value = false
  }
}
const { t } = useI18n()
</script>

<template>
  <div>
    <div class="text-body-small">
      {{ t('coreDam.asset.detail.roi.rotate.rotateMainFileImage') }}
    </div>
    <div
      v-if="loading"
      class="w-100 d-flex align-center justify-center"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>
    <div v-else>
      <ABtnTertiary
        prepend-icon="mdi-rotate-right"
        class="mr-2"
        data-cy="button-rotate-right"
        @click.stop="rotate(90)"
      >
        {{ t('coreDam.asset.detail.roi.rotate.rotateClockwise') }}
      </ABtnTertiary>
      <ABtnTertiary
        prepend-icon="mdi-rotate-left"
        data-cy="button-rotate-left"
        @click.stop="rotate(270)"
      >
        {{ t('coreDam.asset.detail.roi.rotate.rotateCounterclockwise') }}
      </ABtnTertiary>
    </div>
  </div>
</template>
