<script setup lang="ts">
import { ACopyText, useAlerts } from '@anzusystems/common-admin'
import type { AssetFile, AssetFileMainRouteAware, DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { makePrivateFile } from '@/domains/coreDam/asset/api/fileApi'
import { useAssetFileChanged } from '@/domains/coreDam/asset/components/detail/composables/assetDetailFileChange'
import AssetFileRouteChangeBtn from '@/domains/coreDam/shared/assetFileRoute/components/AssetFileRouteChangeBtn.vue'
import AssetFileRouteMakePublicDialog from '@/domains/coreDam/shared/assetFileRoute/components/AssetFileRouteMakePublicDialog.vue'
import AssetFileRouteStatus from '@/domains/coreDam/shared/assetFileRoute/components/AssetFileRouteStatus.vue'
import { assetTypeAcl, useAuth } from '@/domains/system/auth/auth'

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

const canChangeRoute = computed(() => can(assetTypeAcl(props.assetType, 'update')))

const fileChanged = useAssetFileChanged()

const openMakeFilePrivateDialog = (fileId: DocId) => {
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
  menu.value = false
  if (props.isMainFile) fileChanged(props.assetFile.asset)
  emit('mainRouteChanged')
}

const makePrivate = async () => {
  /* One at a time: the item stays in the open menu while the request is on its way, and a second one would be
   * refused - the route is gone by then - over a change that went through. */
  if (loading.value) return
  try {
    loading.value = true
    await makePrivateFile(props.assetType, props.assetFile.id)
  } catch (e) {
    // The request rejects with what axios threw, or with nothing at all: neither is an error the alerts know.
    if (!showErrorsDefault(e)) showUnknownError()
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

  <VMenu
    v-if="assetFile.mainRoute || canChangeRoute"
    v-model="menu"
  >
    <template #activator="{ props: activatorProps }">
      <VBtn
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
          @click.stop="makePrivate"
        />
      </template>
      <AssetFileRouteChangeBtn
        v-else-if="canChangeRoute"
        variant="listItem"
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
