<script setup lang="ts">
import { useAlerts, useTheme } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  bulkUpdateAssetsMetadata,
  hasMetadataToSave,
  showMetadataSaveError,
} from '@/domains/coreDam/asset/api/assetApi'
import AssetFooterSelectedButtonClear from '@/domains/coreDam/asset/components/footer/AssetFooterSelectedButtonClear.vue'
import AssetQueueEditable from '@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'
import { MASS_OPERATIONS_FROM } from '@/domains/coreDam/asset/components/queue/massOperations'
import { useAssetFooterBulkSave } from '@/domains/coreDam/asset/composables/assetFooterBulkSave'
import { useAssetFooterSelectedView } from '@/domains/coreDam/asset/composables/assetFooterSelected'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import { ACL } from '@/domains/system/auth/auth'
import { useWhileOnPage } from '@/domains/system/composables/whileOnPage'

const { t } = useI18n()

const { toolbarColor } = useTheme()

const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

const { footerViewSelected, showMinimalSelected, setMinimalSelected, autoShowSelected, hideSelected } =
  useAssetFooterSelectedView()

const assetListStore = useAssetListStore()
const uploadQueuesStore = useUploadQueuesStore()

const queueTotalCount = computed(() => uploadQueuesStore.getQueueTotalCount(QUEUE_ID_MASS_EDIT))

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

const list = computed(() => uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT))

// Assets whose metadata has not loaded or failed to load. Saving them would send nothing and report a failure.
const nothingToSave = computed(() => !list.value.some(hasMetadataToSave))

const { assetIdsToSave, leaveTypedOfPanel, refreshDetailAsset, panelTakesTypingAgain, typedKeptAfterFailure } =
  useAssetFooterBulkSave()

const toggleMassOperations = async () => {
  massOperations.value = !massOperations.value
}

const { showRecordWas, showValidationError } = useAlerts()
const whileOnPage = useWhileOnPage()

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
  const savedAssetIds = assetIdsToSave(list.value)
  const left = await leaveTypedOfPanel(savedAssetIds)
  if (left === null) {
    saveButtonLoading.value = false
    return
  }
  try {
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
    refreshDetailAsset(savedAssetIds)
  } catch (error) {
    typedKeptAfterFailure(left)
    showMetadataSaveError(error)
  } finally {
    panelTakesTypingAgain(left)
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
  const savedAssetIds = assetIdsToSave(list.value)
  const left = await leaveTypedOfPanel(savedAssetIds)
  if (left === null) {
    saveAndCloseButtonLoading.value = false
    return
  }
  try {
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
    refreshDetailAsset(savedAssetIds)
    /*
     * Not after leaving the page. The lists share the mass edit, and the next list
     * empties it on render. Its contents and full-page dialogs belong to that page.
     * A different list query, or a detail URL written past the router, is the same page.
     * A navigation still asking whether to leave waits for the answer.
     */
    whileOnPage(() => void onClearConfirm())
  } catch (error) {
    typedKeptAfterFailure(left)
    showMetadataSaveError(error)
  } finally {
    panelTakesTypingAgain(left)
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
              :aria-label="t('coreDam.asset.selected.save')"
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
          <!-- With fewer than two rows there is no panel to open. -->
          <VBtn
            v-if="list.length >= MASS_OPERATIONS_FROM"
            :aria-label="t('coreDam.asset.massOperations.title')"
            :aria-expanded="massOperations"
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
            :aria-label="t('common.system.modal.hide')"
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
