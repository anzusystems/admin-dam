<script setup lang="ts">
import { ACopyText, AssetFileProcessStatus, useAlerts } from '@anzusystems/common-admin'
import type { AssetFile, AssetFileMainRouteAware, DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { makePrivateFile } from '@/domains/coreDam/asset/api/fileApi'
import { useAssetFileChanged } from '@/domains/coreDam/asset/components/detail/composables/assetDetailFileChange'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import AssetFileRouteChangeBtn from '@/domains/coreDam/shared/assetFileRoute/components/AssetFileRouteChangeBtn.vue'
import AssetFileRouteMakePublicDialog from '@/domains/coreDam/shared/assetFileRoute/components/AssetFileRouteMakePublicDialog.vue'
import AssetFileRouteStatus from '@/domains/coreDam/shared/assetFileRoute/components/AssetFileRouteStatus.vue'
import { assetTypeAcl, useAuth } from '@/domains/system/auth/auth'
import { useWhileOnPage } from '@/domains/system/composables/whileOnPage'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
    assetFile: AssetFile & AssetFileMainRouteAware
    title: string
    // The file is its asset's main file, shown with its route on the asset detail Info tab.
    isMainFile?: boolean
    dataCy?: string
  }>(),
  {
    isMainFile: false,
    dataCy: undefined,
  }
)

const emit = defineEmits<{ mainRouteChanged: [] }>()

const makeFilePrivateDialog = ref(false)
const loading = ref(false)
const menu = ref(false)
const makeFilePrivateDialogFileId = ref<DocId>('')

const { showErrorsDefault, showUnknownError } = useAlerts()
const { can } = useAuth()
// Errors are shown on the page the change was made from, not on the next one.
const whileOnPage = useWhileOnPage()

const canChangeRoute = computed(() => can(assetTypeAcl(props.assetType, 'update')))
/*
 * The server makes only processed files public and rejects others without a reason.
 * A file still in progress stays so until its asset or slots are read again.
 */
const canMakePublic = computed(
  () => canChangeRoute.value && props.assetFile.fileAttributes.status === AssetFileProcessStatus.Processed
)

const fileChanged = useAssetFileChanged()

/*
 * The file whose route change succeeded. It stays stale until reread with its asset or slots.
 * A menu opened meanwhile would offer the change again, and the server would reject it.
 * Disabled until the file changes.
 */
const changedFile = shallowRef<object | null>(null)
const awaitsRead = computed(() => changedFile.value === props.assetFile)
// Also disabled while the asset is being deleted.
const assetDetailStore = useAssetDetailStore()
const changeOff = computed(() => awaitsRead.value || assetDetailStore.isDeleting)

const openMakeFilePrivateDialog = (fileId: DocId) => {
  if (changeOff.value) return
  makeFilePrivateDialogFileId.value = fileId
  makeFilePrivateDialog.value = true
}

/*
 * Notifies only after a successful change; a failed one has nothing new to read.
 * The page drawing the asset detail is told first for a main file. With no unsaved input it shows the loader,
 * and the Slots tab reads slots only if it stays drawn. If the
 * component is unmounted by the answer, the event is dropped.
 * The menu closes too: the form stays mounted over a reread that keeps
 * unsaved metadata, and an open menu would offer the opposite action.
 */
const routeChanged = () => {
  changedFile.value = props.assetFile
  menu.value = false
  if (props.isMainFile) fileChanged(props.assetFile.asset)
  emit('mainRouteChanged')
}

const makePrivate = async () => {
  /*
   * One at a time: the item stays in the open menu during the request,
   * and a second request would be rejected after the first succeeded.
   */
  if (loading.value || changeOff.value) return
  try {
    loading.value = true
    await makePrivateFile(props.assetType, props.assetFile.id)
  } catch (e) {
    whileOnPage(() => {
      if (!showErrorsDefault(e)) showUnknownError()
    })
    loading.value = false
    return
  }
  routeChanged()
  loading.value = false
}
const { t } = useI18n()
</script>

<template>
  <AssetFileRouteStatus :asset-file-route="assetFile" />

  <!-- Hidden when there is nothing to offer: a private file the user may not or cannot yet make public. -->
  <VMenu
    v-if="assetFile.mainRoute || canMakePublic"
    v-model="menu"
  >
    <template #activator="{ props: activatorProps }">
      <VBtn
        :aria-label="t('common.button.moreOptions')"
        variant="text"
        size="x-small"
        icon
        v-bind="activatorProps"
      >
        <VIcon icon="mdi-dots-vertical" />
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ t('common.button.moreOptions') }}
        </VTooltip>
      </VBtn>
    </template>
    <VList density="compact">
      <template v-if="assetFile.mainRoute">
        <ACopyText
          v-if="assetFile.mainRoute"
          notify-t="coreDam.asset.assetFilePublicLink.actions.notify"
          :value="assetFile.mainRoute.publicUrl"
        >
          <template #activator="{ props: copyButtonProps }">
            <VListItem
              v-bind="copyButtonProps"
              :title="t('coreDam.asset.assetFilePublicLink.actions.copyUrl')"
            />
          </template>
        </ACopyText>
        <AssetFileRouteChangeBtn
          v-if="canChangeRoute"
          variant="listItem"
          button-t="coreDam.asset.assetFilePublicLink.actions.makePrivate"
          icon="mdi-lock"
          :loading="loading"
          :disabled="changeOff"
          @click.stop="makePrivate"
        />
      </template>
      <AssetFileRouteChangeBtn
        v-else-if="canMakePublic"
        variant="listItem"
        :disabled="changeOff"
        @click.stop="openMakeFilePrivateDialog"
      />
    </VList>
  </VMenu>
  <AssetFileRouteMakePublicDialog
    v-model="makeFilePrivateDialog"
    :asset-type="assetType"
    :file-id="assetFile.id"
    :title="title"
    :made-public="routeChanged"
  />
</template>
