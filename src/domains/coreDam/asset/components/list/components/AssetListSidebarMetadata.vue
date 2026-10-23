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

/* Behind the loader while the asset is read, and while a save of the mass edit is on its way for it after "Leave
 * anyway" let what was typed go: the read after that save replaces the form, and nothing typed meanwhile is kept. */
const formAway = computed(
  () => loader.value || (!isNull(asset.value) && assetDetailStore.leftForMassSave === asset.value.id)
)
const uploadQueueStore = useUploadQueuesStore()

/* Saved before the server has processed the file, the form would overwrite what it fills in from the file. Also once
 * the asset got another main file under what was typed: the form is still the one read before that. */
const saveBlocked = computed(() => !isNull(asset.value) && (saveHeldBack.value || metadataMayStillChange(asset.value)))
/* Held back for a main file that failed or is processed, nothing is left to be processed: the asset read whole - opened
 * again, once what was typed is left - frees "Save". The line under it says which. */
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
  /* The view stays as the detail opened last left it, so it is set here as well. Of the list only while the panel
   * holds the asset of the active tile: it can hold one of a queue row, or one just created, and the detail would
   * walk the list from a tile that is not its own. */
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

/* The button only spins while a save is on its way, so another can start. What a save takes of what was typed, and
 * what it leaves unsaved when it fails - only while no save of the form, here or in the detail, has saved as much,
 * and none on its way takes it too - the store keeps (`saveSent`). */
const onSave = async () => {
  if (isNull(asset.value)) return
  saveButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveButtonLoading.value = false
    return
  }
  // What this save sends, taken as it starts: another asset can be opened, or this one typed into, while it is on the
  // wire. The switch is the panel's own, not the value the asset was opened with.
  const saved = { ...cloneDeep(asset.value), mainFileSingleUse: mainFileSingleUse.value }
  /* Before the request, not after it: what is typed while it is on the wire is not in it. Known to a read of the asset
   * that nobody here started too: its answer can be from before this save. */
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
    // Into a row of the asset in a queue too: a later bulk save sends that row.
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

// An asset being deleted - by the detail, by the bin of a queue row, elsewhere - has nothing to be saved into.
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
      <!-- Not for an asset being deleted: "Save" is off for that, and neither line would come true. -->
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
