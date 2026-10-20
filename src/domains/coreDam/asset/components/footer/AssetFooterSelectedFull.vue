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
import { MASS_OPERATIONS_FROM } from '@/domains/coreDam/asset/components/queue/massOperations'
import { useAssetFooterSelectedView } from '@/domains/coreDam/asset/composables/assetFooterSelected'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
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
  /* Read already, behind the loader: by what a change of a file of the asset set off, which waited for the same read as
   * this one. Started once the save was answered, that read brings the asset as saved, and says so when it fails -
   * read here again, it would be called off unseen. */
  if (assetDetailStore.loader && assetDetailStore.shownOrReadAssetId() === shown.id) return
  assetDetailStore.showLoader()
  const detailRequest = assetDetailStore.startDetailRequest(shown.id)
  try {
    const res = await fetchAsset(shown.id)
    if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.setAsset(res, detailRequest)
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

/* The read after the save puts the asset as saved into the panel beside the list, over what was typed into it and not
 * saved: asked about first, as every other way that throws that away. "Stay" sends nothing (`null`); "Leave anyway"
 * saves, and the read replaces what was typed (the id of the asset). With nothing typed, or another asset in the panel,
 * nothing is asked (`false`). Let go, the form takes no typing while the save is on its way: the mass edit can be put
 * away meanwhile, and what was typed then would be replaced without a word. */
const leaveTypedOfPanel = async (savedAssetIds: string[]) => {
  const held = assetDetailStore.asset
  if (!assetDetailStore.panelHoldsUnsavedMetadata || isNull(held) || !savedAssetIds.includes(held.id)) return false
  if (!(await assetDetailStore.askToLeaveUnsaved())) return null
  assetDetailStore.leftForMassSave = held.id

  return held.id
}

/* Answered: the read after the save has started by now, behind the loader, or there is none to come (another asset in
 * the panel). Failed: the form is given back as it was. */
const panelTakesTypingAgain = (left: string | false) => {
  if (left && assetDetailStore.leftForMassSave === left) assetDetailStore.leftForMassSave = null
}

/* A save that failed after "Leave anyway" reads nothing: what was typed stays in the panel, unsaved, and is asked
 * about again - also behind the loader of a read that comes later. */
const typedKeptAfterFailure = (left: string | false) => {
  if (left) assetDetailStore.typedLeft = false
}

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
  const savedAssetIds = assetIdsToSave()
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
  const savedAssetIds = assetIdsToSave()
  const left = await leaveTypedOfPanel(savedAssetIds)
  if (left === null) {
    saveAndCloseButtonLoading.value = false
    return
  }
  try {
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
    refreshDetailAsset(savedAssetIds)
    /* Not when the page was left meanwhile: the lists share the mass edit, and the next list empties it as it is drawn -
     * what it holds by then was picked there, and a dialog over the whole page is that page's. Another query of the list,
     * or the address of a detail written past the router, is the same page; a way out still asking whether to leave
     * waits for the answer. */
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
          <!-- Under two rows there is no panel to open. -->
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
