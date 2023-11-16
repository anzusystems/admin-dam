<script lang="ts" setup>
import { ref } from 'vue'
import { ADialogToolbar, DamDistributionServiceType, isNull, useAlerts } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { useAssetDetailDistributionDialogCancel } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialogCancel'
import { cancelCustomDistribution } from '@/services/api/coreDam/distributionCustomApi'

const emit = defineEmits<{
  (e: 'reloadList'): void
}>()

const { dialogCancel, distributionIdToCancel, distributionTypeToCancel } = useAssetDetailDistributionDialogCancel()

const { t } = useI18n()

const buttonLoading = ref(false)

const onCancel = () => {
  dialogCancel.value = false
}
const { showErrorsDefault } = useAlerts()

const onConfirm = async () => {
  if (
    isNull(distributionIdToCancel.value) ||
    isNull(distributionTypeToCancel.value) ||
    distributionTypeToCancel.value !== DamDistributionServiceType.Custom
  )
    return
  buttonLoading.value = true
  try {
    await cancelCustomDistribution(distributionIdToCancel.value)
    emit('reloadList')
  } catch (e) {
    showErrorsDefault(e)
  } finally {
    buttonLoading.value = false
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
      <ADialogToolbar @on-cancel="onCancel">
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
