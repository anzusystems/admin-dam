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
    // The file is the main one of its asset: the Info tab of a detail of the asset shows it, with its route.
    isMainFile?: boolean
    dataCy?: string
  }>(),
  {
    isMainFile: false,
    dataCy: undefined,
  }
)

const emit = defineEmits<{
  (e: 'mainRouteChanged'): void
}>()

const makeFilePrivateDialog = ref(false)
const loading = ref(false)
const menu = ref(false)
const makeFilePrivateDialogFileId = ref<DocId>('')

const { showErrorsDefault, showUnknownError } = useAlerts()
const { can } = useAuth()
// Said on the page the change was asked from, as the failure of the read after it: not on the next one.
const whileOnPage = useWhileOnPage()

const canChangeRoute = computed(() => can(assetTypeAcl(props.assetType, 'update')))
/* The server makes public only a file it has processed, and refuses any other without saying why. A file held as
 * still on its way is held so until its asset, or the slots, are read again. */
const canMakePublic = computed(
  () => canChangeRoute.value && props.assetFile.fileAttributes.status === AssetFileProcessStatus.Processed
)

const fileChanged = useAssetFileChanged()

/* The file a change of its route went through for. It is held as it was until it is read again - with its asset, with
 * the slots -, and a menu opened meanwhile would offer the change again: the server refuses it, the route is gone or
 * there by then. Off until the file is another one. */
const changedFile = shallowRef<object | null>(null)
const awaitsRead = computed(() => changedFile.value === props.assetFile)
// Nor any change of the route of a file of an asset being deleted.
const assetDetailStore = useAssetDetailStore()
const changeOff = computed(() => awaitsRead.value || assetDetailStore.isDeleting)

const openMakeFilePrivateDialog = (fileId: DocId) => {
  if (changeOff.value) return
  makeFilePrivateDialogFileId.value = fileId
  makeFilePrivateDialog.value = true
}

/* Told only once the change went through: after one that failed there is nothing new to read. The page that draws
 * the detail of the asset is told first, when the file is the main one: with nothing typed it puts the detail behind
 * its loader, and what hears the event - the Slots tab - reads the slots only when it stays drawn. The answer can
 * find this component unmounted: its props are then as they were last, and the event is dropped. The menu goes
 * with it: the form stays mounted over a read that keeps metadata that were not saved, and the menu stayed open in
 * it, by then offering the opposite action. */
const routeChanged = () => {
  changedFile.value = props.assetFile
  menu.value = false
  if (props.isMainFile) fileChanged(props.assetFile.asset)
  emit('mainRouteChanged')
}

const makePrivate = async () => {
  /* One at a time: the item stays in the open menu while the request is on its way, and a second one would be
   * refused - the route is gone by then - over a change that went through. */
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

  <!-- Not drawn with nothing to offer: a private file the user may not make public, or cannot yet. -->
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
