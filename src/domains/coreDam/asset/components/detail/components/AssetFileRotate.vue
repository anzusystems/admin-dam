<script lang="ts" setup>
import { useAlerts } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useImageRotationStore } from '@/domains/coreDam/asset/store/imageRotationStore'

const props = withDefaults(
  defineProps<{
    imageId: DocId
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)

const { showRecordWas, showErrorsDefault, showUnknownError } = useAlerts()

// The rotation runs in the store so a reopened tab waits for it and gets its result.
const rotationStore = useImageRotationStore()
// The asset detail store tells whether the asset is being deleted.
const assetDetailStore = useAssetDetailStore()

const rotate = async (angle: 90 | 270) => {
  try {
    if (await rotationStore.rotate(props.imageId, angle)) showRecordWas('updated')
  } catch (e) {
    // Shows the server's refusal reason, otherwise an unknown error.
    if (!showErrorsDefault(e)) showUnknownError()
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
      v-if="rotationStore.isRotating(imageId)"
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
        :disabled="assetDetailStore.isDeleting"
        @click.stop="rotate(90)"
      >
        {{ t('coreDam.asset.detail.roi.rotate.rotateClockwise') }}
      </ABtnTertiary>
      <ABtnTertiary
        prepend-icon="mdi-rotate-left"
        data-cy="button-rotate-left"
        :disabled="assetDetailStore.isDeleting"
        @click.stop="rotate(270)"
      >
        {{ t('coreDam.asset.detail.roi.rotate.rotateCounterclockwise') }}
      </ABtnTertiary>
    </div>
  </div>
</template>
