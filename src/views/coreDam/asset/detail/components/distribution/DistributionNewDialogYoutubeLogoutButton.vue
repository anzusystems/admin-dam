<script lang="ts" setup>
import { ADialogToolbar, useAlerts } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { logoutYoutube } from '@/services/api/coreDam/distributionYoutubeApi'
import type { DistributionServiceName } from '@/types/coreDam/DamConfig'
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    distributionServiceName: DistributionServiceName
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'onSuccessLogout'): void
}>()

const dialog = ref(false)
const buttonLoading = ref(false)

const { t } = useI18n()
const { showErrorsDefault } = useAlerts()

const openDialog = () => {
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
}

const confirmLogout = async () => {
  try {
    buttonLoading.value = true
    await logoutYoutube(props.distributionServiceName)
    emit('onSuccessLogout')
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    buttonLoading.value = false
  }
}
</script>

<template>
  <ABtnTertiary @click.stop="openDialog">
    {{ t('coreDam.youtubeDistribution.logout.logoutOpen') }}
  </ABtnTertiary>
  <VDialog v-model="dialog">
    <VCard
      v-if="dialog"
      width="500"
      class="mt-0 mr-auto ml-auto"
      data-cy="create-panel"
    >
      <ADialogToolbar @on-cancel="closeDialog">
        {{ t('coreDam.youtubeDistribution.logout.logoutTitle') }}
      </ADialogToolbar>
      <VCardText>
        {{ t('coreDam.youtubeDistribution.logout.logoutText') }}
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="closeDialog"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="buttonLoading"
          data-cy="button-confirm"
          @click.stop="confirmLogout"
        >
          {{ t('coreDam.youtubeDistribution.logout.logoutConfirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
