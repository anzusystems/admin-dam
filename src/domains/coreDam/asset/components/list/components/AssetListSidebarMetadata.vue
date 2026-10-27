<script lang="ts" setup>
import {
  AssetFileProcessStatus,
  DamAssetStatus,
  browserHistoryReplaceUrlByRouter,
  cloneDeep,
  isNull,
  useAlerts,
  useDamCachedUsers,
} from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { showMetadataSaveError, updateAssetMetadata } from '@/domains/coreDam/asset/api/assetApi'
import AssetInfobox from '@/domains/coreDam/asset/components/AssetInfobox.vue'
import AssetMetadata from '@/domains/coreDam/asset/components/AssetMetadata.vue'
import { useAssetDetailActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailActions'
import { useAssetListActions } from '@/domains/coreDam/asset/components/list/composables/assetListActions'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import { metadataMayStillChange, useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import { ACL } from '@/domains/system/auth/auth'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'

const { sidebarRight } = useMainWrapper()
const router = useRouter()

const saveButtonLoading = ref(false)

const { t } = useI18n()

const {
  asset,
  loader,
  metadataAreTouched,
  mainFileSingleUse,
  mainFileOverrideInternal,
  mainFileInternal,
  ttsAudio,
  saveHeldBack,
} = useAssetDetailActions()

const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()

/*
 * Hidden behind the loader while the asset loads, and while a mass-edit
 * save is in flight after "Leave anyway" discarded the typed data.
 * The read after that save replaces the form, so nothing typed meanwhile would be kept.
 */
const formAway = computed(
  () => loader.value || (!isNull(asset.value) && assetDetailStore.leftForMassSave === asset.value.id)
)
const uploadQueueStore = useUploadQueuesStore()

/*
 * "Save" is blocked while the server may still fill metadata from
 * the file, or after the main file changed under what was typed.
 * Saving then would overwrite what the server fills in, because the form is older.
 */
const saveBlocked = computed(() => !isNull(asset.value) && (saveHeldBack.value || metadataMayStillChange(asset.value)))
/*
 * Held back for a main file that is processed or failed: reading the asset whole frees "Save".
 * That happens when the asset is opened again or nothing typed is left. The line below says which case applies.
 */
const heldBackLine = computed(() => {
  switch (asset.value?.mainFile?.fileAttributes.status) {
    case AssetFileProcessStatus.Failed:
      return 'coreDam.asset.detail.fileFailedOpenAgain'
    case AssetFileProcessStatus.Processed:
      return 'coreDam.asset.detail.fileProcessedOpenAgain'
    default:
      return 'coreDam.asset.detail.fileStillProcessing'
  }
})

const { showRecordWas, showValidationError } = useAlerts()
const { readHeldUnlessTyped } = useAssetListActions()

const onEditMore = async () => {
  /*
   * The view persists from the last opened detail, so set it here too.
   * Use `list` only when the panel holds the active tile's asset. It may hold a queue row's
   * asset or a newly created one, and the detail would walk the list from the wrong tile.
   */
  const held = assetDetailStore.asset
  const ofActiveTile = !isNull(held) && assetListStore.getActiveAsset()?.asset.id === held.id
  assetDetailStore.setView(ofActiveTile ? 'list' : 'queue')
  assetDetailStore.showDetail()
  if (!assetDetailStore.asset) return
  browserHistoryReplaceUrlByRouter(router, {
    name: '/(coreDam)/assets/[id]',
    params: { id: assetDetailStore.asset.id },
  })
  await readHeldUnlessTyped()
}

const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })

/*
 * The button spins only while a save is in flight, so another save can start.
 * The store (`saveSent`) tracks what each save takes from the typed data, and what stays unsaved if it fails.
 */
const onSave = async () => {
  if (isNull(asset.value)) return
  saveButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveButtonLoading.value = false
    return
  }
  // Snapshot the payload at start. Another asset can be opened, or this one edited, while the request is in flight.
  // Use the panel's own switch, not the value the asset was opened with.
  const saved = { ...cloneDeep(asset.value), mainFileSingleUse: mainFileSingleUse.value }
  /*
   * Called before the request so edits made during it are not counted as sent.
   * Other asset reads also see it, since their answer can predate this save.
   */
  const saveAnswered = assetDetailStore.saveSent(asset.value)
  let failed = false
  try {
    await updateAssetMetadata(
      saved,
      mainFileSingleUse.value,
      mainFileOverrideInternal.value,
      mainFileInternal.value,
      ttsAudio.value
    )
    // Also update the asset's row in a queue, because a later bulk save sends that row.
    uploadQueueStore.updateAssetMetadata(saved)
    showRecordWas('updated')
  } catch (error) {
    failed = true
    showMetadataSaveError(error)
  } finally {
    saveAnswered(failed)
    saveButtonLoading.value = false
  }
}

const assetStatus = computed(() => asset.value?.attributes.assetStatus || DamAssetStatus.Draft)

// An asset being deleted, by the detail, a queue row's bin or elsewhere, cannot be saved into.
const isDeleting = computed(() => assetDetailStore.isDeleting)

const assetMainFile = computed(() => asset.value?.mainFile || undefined)

watch(
  asset,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue !== null) {
      if (newValue.createdBy) addToCachedUsers(newValue.createdBy)
      if (newValue.modifiedBy) addToCachedUsers(newValue.modifiedBy)
      fetchCachedUsers()
    }
  },
  { immediate: true }
)
</script>

<template>
  <VNavigationDrawer
    v-model="sidebarRight"
    permanent
    location="right"
    :width="300"
  >
    <div
      v-if="formAway"
      class="d-flex w-100 h-100 align-center justify-center"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>
    <div
      v-else-if="!asset"
      class="d-flex w-100 h-100 align-center justify-center"
    >
      {{ t('coreDam.asset.detail.noAssetSelected') }}
    </div>
    <div v-else>
      <AssetInfobox
        :asset-status="assetStatus"
        :asset-main-file-status="assetMainFile ? assetMainFile.fileAttributes.status : undefined"
        :asset-main-file-fail-reason="assetMainFile ? assetMainFile.fileAttributes.failReason : undefined"
      />
      <AssetMetadata />
    </div>
    <template
      v-if="!formAway && asset"
      #append
    >
      <!-- Hidden for an asset being deleted: "Save" is off, so neither line applies. -->
      <Acl :permission="ACL.DAM_ASSET_UPDATE">
        <div
          v-if="saveBlocked && !isDeleting"
          class="px-2 pt-2 text-body-small text-center"
        >
          {{ t(heldBackLine) }}
        </div>
      </Acl>
      <div class="pa-2 d-flex align-center justify-center">
        <ABtnSecondary
          class="mr-2"
          size="small"
          @click.stop="onEditMore"
        >
          {{ t('coreDam.asset.detail.info.edit') }}
        </ABtnSecondary>
        <Acl :permission="ACL.DAM_ASSET_UPDATE">
          <VBtn
            color="primary"
            size="small"
            :variant="metadataAreTouched ? 'flat' : 'text'"
            :loading="saveButtonLoading"
            :disabled="saveBlocked || isDeleting"
            @click.stop="onSave"
          >
            {{ t('common.button.save') }}
          </VBtn>
        </Acl>
      </div>
    </template>
  </VNavigationDrawer>
</template>
