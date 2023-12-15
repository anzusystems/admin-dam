<script setup lang="ts">

import {
  type AssetFile,
  type AssetFileMainRouteAware, ATableCopyIdButton,
  type DamAssetType,
  type DocId, useAlerts
} from '@anzusystems/common-admin'
import AssetFileRouteStatus from '@/views/coreDam/assetFileRoute/components/AssetFileRouteStatus.vue'
import { ref } from 'vue'
import AssetFileRouteMakePublicDialog
  from '@/views/coreDam/assetFileRoute/components/AssetFileRouteMakePublicDialog.vue'
import { makePrivateFile } from '@/services/api/coreDam/fileApi'
import AssetFileRouteChangeBtn from '@/views/coreDam/assetFileRoute/components/AssetFileRouteChangeBtn.vue'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetType
    assetFile: AssetFile&AssetFileMainRouteAware
    title: string
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)

const emit = defineEmits<{
  (e: 'mainRouteChanged'): void
}>()

const makeFilePrivateDialog = ref(false)
const loading = ref(false)
const makeFilePrivateDialogFileId = ref<DocId>('')

const { showErrorsDefault } = useAlerts()

const openMakeFilePrivateDialog = (fileId: DocId) => {
  makeFilePrivateDialogFileId.value = fileId
  makeFilePrivateDialog.value = true
}

const makePrivate = async () => {
  try {
    loading.value = true
    await makePrivateFile(props.assetType, props.assetFile.id)
  } catch (e) {
    showErrorsDefault(e)
  } finally {
    emit('mainRouteChanged')
  }
  loading.value = false
}

</script>

<template>
  <AssetFileRouteStatus
    :asset-file-route="assetFile"
    @make-private="makePrivate"
    @open-make-public-dialog="openMakeFilePrivateDialog"
  />

  <AssetFileRouteChangeBtn
    v-if="assetFile.mainRoute"
    button-t="coreDam.asset.assetFilePublicLink.actions.makePrivate"
    icon="mdi-lock"
    :loading="loading"
    @click.stop="makePrivate"
  />
  <AssetFileRouteChangeBtn
    v-else
    @click.stop="openMakeFilePrivateDialog"
  />

  <AssetFileRouteMakePublicDialog
    v-model="makeFilePrivateDialog"
    :asset-type="assetType"
    :file-id="assetFile.id"
    :title="title"
    @after-update="emit('mainRouteChanged')"
  />

  <ATableCopyIdButton
    v-if="assetFile.mainRoute"
    :id="assetFile.mainRoute.publicUrl"
  />
</template>
