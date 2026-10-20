<script lang="ts" setup>
import { ADialogToolbar, DamDistributionServiceType, isNull, useAlerts } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { cancelCustomDistribution } from '@/domains/coreDam/asset/api/distributionCustomApi'
import { useAssetDetailDistributionDialogCancel } from '@/domains/coreDam/asset/components/detail/composables/assetDetailDistributionDialogCancel'
import { useDistributionListStore } from '@/domains/coreDam/asset/store/distributionListStore'

const emit = defineEmits<{
  (e: 'reloadList'): void
}>()

const { dialogCancel, distributionIdToCancel, distributionTypeToCancel } = useAssetDetailDistributionDialogCancel()
const distributionListStore = useDistributionListStore()

const { t } = useI18n()

/* The distributions being stopped: the dialog is one for all of them, and opened for another one while the first is
 * asked about, it stops that one. */
const stopping = reactive(new Set<DocId>())
const buttonLoading = computed(
  () => !isNull(distributionIdToCancel.value) && stopping.has(distributionIdToCancel.value)
)

const onCancel = () => {
  dialogCancel.value = false
}
const { showRecordWas, showErrorsDefault } = useAlerts()

const onConfirm = async () => {
  // The keyboard reaches a button that spins.
  if (buttonLoading.value) return
  if (
    isNull(distributionIdToCancel.value) ||
    isNull(distributionTypeToCancel.value) ||
    distributionTypeToCancel.value !== DamDistributionServiceType.Custom
  )
    return
  const distributionId = distributionIdToCancel.value
  stopping.add(distributionId)
  try {
    await cancelCustomDistribution(distributionId)
    // Out of the list at once: the read asked for below can fail, and the list would keep what is stopped, with the
    // button that stops it.
    distributionListStore.removeListItem(distributionId)
    // The dialog is one for every distribution, and can be closed while the server is asked and opened for another:
    // that one was not stopped.
    if (distributionIdToCancel.value === distributionId) dialogCancel.value = false
    showRecordWas('deleted')
    emit('reloadList')
  } catch (e) {
    showErrorsDefault(e)
  } finally {
    stopping.delete(distributionId)
  }
}
</script>

<template>
  <VDialog
    v-model="dialogCancel"
    scrollable
    :max-width="500"
  >
    <VCard v-if="dialogCancel">
      <ADialogToolbar @cancel="onCancel">
        {{ t('coreDam.distribution.common.cancelDistributionButton') }}
      </ADialogToolbar>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="buttonLoading"
          @click.stop="onConfirm"
        >
          {{ t('common.button.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
