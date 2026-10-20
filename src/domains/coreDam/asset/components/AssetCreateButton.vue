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

const emit = defineEmits<{
  (e: 'afterCreate', data: AssetDetailItemDto): void
}>()

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
  /* The asset is made all the same, and what holds a second confirm back goes with this dialog: the menu it is in is
   * drawn anew each time it is opened, and a dialog opened from it again would make a second asset. */
  if (buttonLoading.value) return
  dialog.value = false
}

/* Nor does the page go meanwhile, with the dialog: the back button of the browser onto an entry where ADAM was loaded
 * or reloaded gets past Vuetify, which otherwise only closes the dialog. Nor its address: the page of another provider
 * is the same page of the router, and the application draws each address anew; another query is drawn on. */
onBeforeRouteLeave(() => !buttonLoading.value)
onBeforeRouteUpdate((to, from) => to.path === from.path || !buttonLoading.value)

const { showRecordWas, showErrorsDefault } = useAlerts()

const showDetail = async (asset: AssetDetailItemDto) => {
  assetDetailStore.setView('queue')
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  /* Nothing is fetched here - the asset has just been created - but the detail is opened all the
   * same, so it has to take its turn: a request from before this one, coming back with an error,
   * would otherwise see an open dialog and close it over the new asset. */
  assetDetailStore.startDetailRequest(asset.id)
  assetDetailStore.setAsset(asset)
  addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
  fetchCachedUsers()
  assetDetailStore.hideLoader()
}

const onConfirm = async () => {
  // A second confirm while the first is on its way would make a second asset.
  if (buttonLoading.value) return
  /* On a page that draws no detail of an asset the new one is shown on its own page, in a tab opened here, at the
   * press. Nothing of this page is replaced by it, so there is nothing to ask about. */
  const tab = opensInNewTab() ? openTabForAsset() : null
  // No tab given, nothing is made: the asset would be made with nothing to show it in. The editor was told why.
  if (tab && !tab.opened) return
  /* Otherwise the asset made here is written into the detail the panel beside the list reads from: metadata typed
   * into the panel and not saved go only when told to, asked about before anything is sent. */
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
