<script lang="ts" setup>
import {
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
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { metadataMayStillChange, useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import { ACL } from '@/domains/system/auth/auth'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'

const emit = defineEmits<{
  (e: 'mainRouteChanged'): void
}>()

const { sidebarRight } = useMainWrapper()
const router = useRouter()

const saveButtonLoading = ref(false)

const { t } = useI18n()

const {
  asset,
  loader,
  metadataTouch,
  metadataUnTouch,
  metadataAreTouched,
  mainFileSingleUse,
  mainFileOverrideInternal,
  mainFileInternal,
  ttsAudio,
} = useAssetDetailActions()

const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

const assetDetailStore = useAssetDetailStore()
const uploadQueueStore = useUploadQueuesStore()

// Saved before the server has processed the file, the form would overwrite what it fills in from the file.
const saveBlocked = computed(() => !isNull(asset.value) && metadataMayStillChange(asset.value))

const { showRecordWas, showValidationError } = useAlerts()

const onEditMore = async () => {
  assetDetailStore.showDetail()
  if (!assetDetailStore.asset) return
  browserHistoryReplaceUrlByRouter(router, {
    name: '/(coreDam)/assets/[id]',
    params: { id: assetDetailStore.asset.id },
  })
}

const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })

/* The save of this panel that started last: the button only spins meanwhile, so another can start. A save that fails
 * puts "touched" back only while it is still that one - a later save sent what the form held by then, and its end
 * is the one that counts. A save started while another of the same asset is on the wire takes over the "touched"
 * that one took off. */
let latestSave: { opened: object; touched: boolean; pending: boolean } | undefined

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
  const opened = asset.value
  const save = {
    opened,
    touched: metadataAreTouched.value || (!!latestSave?.pending && latestSave.opened === opened && latestSave.touched),
    pending: true,
  }
  latestSave = save
  try {
    // Before the request, not after it: what is typed while it is on the wire is not in it.
    metadataUnTouch()
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
    // Nothing was saved, so the form is as unsaved as it was - unless the panel holds another asset by now, or this
    // one read again.
    if (save.touched && asset.value === opened && latestSave === save) metadataTouch()
    showMetadataSaveError(error)
  } finally {
    save.pending = false
    saveButtonLoading.value = false
  }
}

const assetStatus = computed(() => {
  return asset.value?.attributes.assetStatus || DamAssetStatus.Draft
})

const assetMainFile = computed(() => {
  return asset.value?.mainFile || undefined
})

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
      v-if="loader"
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
      <AssetMetadata @main-route-changed="emit('mainRouteChanged')" />
    </div>
    <template
      v-if="!loader && asset"
      #append
    >
      <Acl :permission="ACL.DAM_ASSET_UPDATE">
        <div
          v-if="saveBlocked"
          class="px-2 pt-2 text-body-small text-center"
        >
          {{ t('coreDam.asset.detail.fileStillProcessing') }}
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
            :disabled="saveBlocked"
            @click.stop="onSave"
          >
            {{ t('common.button.save') }}
          </VBtn>
        </Acl>
      </div>
    </template>
  </VNavigationDrawer>
</template>
