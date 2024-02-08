<script setup lang="ts">
import {
  ACopyText,
  type AssetFile,
  type AssetFileMainRouteAware,
  type DamAssetType,
  type DocId,
  useAlerts,
} from '@anzusystems/common-admin'
import AssetFileRouteStatus from '@/views/coreDam/assetFileRoute/components/AssetFileRouteStatus.vue'
import { ref } from 'vue'
import AssetFileRouteMakePublicDialog from '@/views/coreDam/assetFileRoute/components/AssetFileRouteMakePublicDialog.vue'
import { makePrivateFile } from '@/services/api/coreDam/fileApi'
import AssetFileRouteChangeBtn from '@/views/coreDam/assetFileRoute/components/AssetFileRouteChangeBtn.vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetType
    assetFile: AssetFile & AssetFileMainRouteAware
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
const { t } = useI18n()
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

  <ACopyText
    v-if="assetFile.mainRoute"
    notify-t="coreDam.asset.assetFilePublicLink.actions.notify"
    :value="assetFile.mainRoute.publicUrl"
  >
    <template #activator="{ props: copyButtonProps }">
      <VBtn
        icon
        size="x-small"
        v-bind="copyButtonProps"
      >
        <VIcon icon="mdi-content-copy" />
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ t('coreDam.asset.assetFilePublicLink.actions.copyUrl') }}
        </VTooltip>
      </VBtn>
    </template>
  </ACopyText>
</template>
