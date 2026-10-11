<script setup lang="ts">
import { isNull, useAlerts, useTheme } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  bulkUpdateAssetsMetadata,
  fetchAsset,
  hasMetadataToSave,
  showMetadataSaveError,
} from '@/domains/coreDam/asset/api/assetApi'
import AssetFooterSelectedButtonClear from '@/domains/coreDam/asset/components/footer/AssetFooterSelectedButtonClear.vue'
import AssetQueueEditable from '@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'
import { useAssetFooterSelectedView } from '@/domains/coreDam/asset/composables/assetFooterSelected'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import { ACL } from '@/domains/system/auth/auth'

const { t } = useI18n()

const { toolbarColor } = useTheme()

const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

const { footerViewSelected, showMinimalSelected, setMinimalSelected, autoShowSelected, hideSelected } =
  useAssetFooterSelectedView()

const assetListStore = useAssetListStore()
const uploadQueuesStore = useUploadQueuesStore()

const queueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(QUEUE_ID_MASS_EDIT)
})

watch(queueTotalCount, (newValue, oldValue) => {
  if (newValue !== oldValue && newValue > 0) {
    autoShowSelected()
  }
})

const onClearConfirm = async () => {
  uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)
  assetListStore.clearSelected()
  hideSelected()
}

const massOperations = ref(true)

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
})

// Assets whose metadata has not loaded, or could not be: the save would send nothing and say it failed.
const nothingToSave = computed(() => !list.value.some(hasMetadataToSave))

const assetDetailStore = useAssetDetailStore()

/* The asset of the detail store still has what it had before the save: it is read again, by its id, when it was among
 * the saved - also under a closed panel, whose toggle opens it on the store without a read. Not the active row of
 * the list, which the panel need not show. */
const readAgainIfSaved = async (savedAssetIds: string[]) => {
  assetDetailStore.forgetLastFetched(savedAssetIds)
  const shown = assetDetailStore.asset
  if (isNull(shown) || !savedAssetIds.includes(shown.id)) return
  assetDetailStore.showLoader()
  const detailRequest = assetDetailStore.startDetailRequest()
  try {
    const res = await fetchAsset(shown.id)
    if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.setAsset(res)
  } catch (error) {
    // The save itself went through: the detail keeps what it had, as before.
    console.error('assetFooterSelected: the asset of the detail could not be read again', error)
  } finally {
    if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
  }
}

/* A read of the detail on its way when the save answers may bring an asset as it was before the save: the read again
 * waits for it to land, so that it neither throws that answer away nor leaves its loader up. A read that starts
 * later is answered after the save, and the shortcut that would skip the read of a saved asset is not taken. */
const refreshDetailAsset = (savedAssetIds: string[]) => {
  assetDetailStore.forgetLastFetched(savedAssetIds)
  assetDetailStore.readAfterCurrentRead(() => void readAgainIfSaved(savedAssetIds))
}

// What the bulk save sends, taken before it: the queue can change while it is on the wire.
const assetIdsToSave = () => list.value.filter(hasMetadataToSave).map((item) => item.assetId)

const toggleMassOperations = async () => {
  massOperations.value = !massOperations.value
}

const { showRecordWas, showValidationError } = useAlerts()

const v$ = useVuelidate()

const onSave = async () => {
  if (list.value.length === 0) return
  saveButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveButtonLoading.value = false
    return
  }
  const savedAssetIds = assetIdsToSave()
  try {
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
    refreshDetailAsset(savedAssetIds)
  } catch (error) {
    showMetadataSaveError(error)
  } finally {
    saveButtonLoading.value = false
  }
}

const onSaveAndClose = async () => {
  if (list.value.length === 0) return
  saveAndCloseButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveAndCloseButtonLoading.value = false
    return
  }
  const savedAssetIds = assetIdsToSave()
  try {
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
    refreshDetailAsset(savedAssetIds)
    await onClearConfirm()
  } catch (error) {
    showMetadataSaveError(error)
  } finally {
    saveAndCloseButtonLoading.value = false
  }
}
</script>

<template>
  <div
    class="asset-footer__selected pa-0"
    :class="'asset-footer--' + footerViewSelected + ' asset-footer__selected--' + footerViewSelected"
  >
    <div class="d-flex w-100 h-100 flex-column">
      <VToolbar
        class="w-100 border-b pr-1"
        :color="toolbarColor"
        density="compact"
        :height="64"
      >
        <div class="d-flex align-center pa-2">
          <div>
            <span class="text-label-large">{{ t('coreDam.asset.selected.selectedFiles') }}: {{ queueTotalCount }}</span>
          </div>
        </div>
        <VSpacer />
        <div class="d-flex align-center">
          <Acl :permission="ACL.DAM_ASSET_UPDATE">
            <ABtnPrimary
              :height="36"
              class="mr-2"
              rounded="pill"
              :loading="saveAndCloseButtonLoading"
              :disabled="saveButtonLoading || nothingToSave"
              @click.stop="onSaveAndClose"
            >
              {{ t('coreDam.asset.selected.saveAndClose') }}
            </ABtnPrimary>
            <VBtn
              icon
              :height="36"
              :width="36"
              :loading="saveButtonLoading"
              :disabled="saveAndCloseButtonLoading || nothingToSave"
              @click.stop="onSave"
            >
              <VIcon icon="mdi-content-save" />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.selected.save') }}
              </VTooltip>
            </VBtn>
          </Acl>
          <VDivider
            vertical
            class="mx-4 my-2"
          />
          <VBtn
            :height="36"
            :width="36"
            :active="massOperations"
            :variant="massOperations ? 'flat' : 'text'"
            :color="massOperations ? 'secondary' : ''"
            class="mr-2"
            icon
            @click.stop="toggleMassOperations"
          >
            <VIcon icon="mdi-tag-text-outline" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.asset.massOperations.title') }}
            </VTooltip>
          </VBtn>
          <VBtn
            v-show="showMinimalSelected"
            icon
            variant="flat"
            :height="36"
            :width="36"
            rounded="circle"
            class="mr-2"
            @click.stop="setMinimalSelected"
          >
            <VIcon icon="mdi-chevron-down" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('common.system.modal.hide') }}
            </VTooltip>
          </VBtn>
          <AssetFooterSelectedButtonClear
            variant="normal"
            @confirm="onClearConfirm"
          />
        </div>
      </VToolbar>
      <AssetQueueEditable
        :queue-id="QUEUE_ID_MASS_EDIT"
        :mass-operations="massOperations"
        disable-done-animation
      />
    </div>
  </div>
</template>
