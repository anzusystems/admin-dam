<script lang="ts" setup>
import {
  ADialogToolbar,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
  useAlerts,
  useDamCachedUsers,
} from '@anzusystems/common-admin'
import type { AssetDetailItemDto } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

import { createAsset } from '@/domains/coreDam/asset/api/assetApi'
import { useAssetInNewTab } from '@/domains/coreDam/asset/composables/assetInNewTab'
import { useCurrentAssetLicence } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAssetFactory } from '@/domains/coreDam/asset/factory/AssetFactory'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import type { AssetCreateDto } from '@/domains/coreDam/asset/types/Asset'
import { useAssetType } from '@/domains/coreDam/asset/valueObject/DamAssetType'
import { ENTITY } from '@/domains/coreDam/author/api/authorApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const emit = defineEmits<{ afterCreate: [data: AssetDetailItemDto] }>()

const { t } = useI18n()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const assetDetailStore = useAssetDetailStore()
const { addToCachedUsers, fetchCachedUsers } = useDamCachedUsers()
const { opensInNewTab, openTabForAsset } = useAssetInNewTab()

const { createCreateDto } = useAssetFactory()
const asset = ref<AssetCreateDto>(createCreateDto())
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  asset.value = createCreateDto()
  dialog.value = true
}

const onCancel = () => {
  /*
   * The asset is still created, and the guard against a second confirm closes with the dialog.
   * The menu is re-rendered on each open, so reopening the dialog would create a second asset.
   */
  if (buttonLoading.value) return
  dialog.value = false
}

/*
 * Blocks leaving the page while creating. The browser back button to an entry where
 * ADAM was loaded or reloaded bypasses Vuetify, which otherwise only closes the dialog.
 * Also blocks address changes: another provider's page is the same
 * router page and is fully re-rendered. A query-only change is allowed.
 */
onBeforeRouteLeave(() => !buttonLoading.value)
onBeforeRouteUpdate((to, from) => to.path === from.path || !buttonLoading.value)

const { showRecordWas, showErrorsDefault } = useAlerts()

const showDetail = async (asset: AssetDetailItemDto) => {
  assetDetailStore.setView('queue')
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  /*
   * Nothing is fetched, but the detail is opened, so it must take a request turn.
   * Otherwise an earlier request returning with an error could see the open dialog and close it over the new asset.
   */
  assetDetailStore.startDetailRequest(asset.id)
  assetDetailStore.setAsset(asset)
  addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
  fetchCachedUsers()
  assetDetailStore.hideLoader()
}

const onConfirm = async () => {
  // A second confirm while the first is on its way would make a second asset.
  if (buttonLoading.value) return
  /*
   * On a page without an asset detail, the new asset opens in a new tab, opened here on the click.
   * Nothing on this page is replaced, so there is no unsaved-changes prompt.
   */
  const tab = opensInNewTab() ? openTabForAsset() : null
  // If the tab was blocked, nothing is created, since there is
  // nowhere to show the asset. The editor was already told why.
  if (tab && !tab.opened) return
  /*
   * Otherwise the new asset replaces the detail the side panel reads from.
   * Unsaved panel metadata is discarded only after confirmation, asked before anything is sent.
   */
  if (!tab && assetDetailStore.panelHoldsUnsavedMetadata && !(await assetDetailStore.askToLeaveUnsaved())) return
  try {
    buttonLoading.value = true
    const res = await createAsset(currentAssetLicenceId.value, asset.value)
    showRecordWas('created')
    dialog.value = false
    emit('afterCreate', res)
    if (tab) tab.show(res.id)
    else await showDetail(res)
  } catch (error) {
    tab?.close()
    showErrorsDefault(error)
  } finally {
    buttonLoading.value = false
  }
}

const { assetTypeOptions } = useAssetType()
</script>

<template>
  <VListItem
    :title="t('coreDam.asset.meta.createEmpty')"
    prepend-icon="mdi-plus"
    data-cy="button-main-empty-asset"
    @click.stop="onClick"
  />
  <VDialog v-model="dialog">
    <VCard
      v-if="dialog"
      width="500"
      class="mt-0 mr-auto ml-auto"
      data-cy="create-panel"
    >
      <ADialogToolbar @cancel="onCancel">
        <slot name="title">
          {{ t('coreDam.asset.meta.createEmpty') }}
        </slot>
      </ADialogToolbar>
      <VCardText>
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <ARow>
            <AFormValueObjectOptionsSelect
              v-model="asset.type"
              :label="t('coreDam.author.model.type')"
              :items="assetTypeOptions"
              data-cy="author-type"
            />
          </ARow>
        </ASystemEntityScope>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          :disabled="buttonLoading"
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="buttonLoading"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t('common.button.create') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
