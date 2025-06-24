<script setup lang="ts">
import { makePrivateFile } from '@/services/api/coreDam/fileApi'
import AssetFileRouteChangeBtn from '@/views/coreDam/assetFileRoute/components/AssetFileRouteChangeBtn.vue'
import AssetFileRouteMakePublicDialog from '@/views/coreDam/assetFileRoute/components/AssetFileRouteMakePublicDialog.vue'
import AssetFileRouteStatus from '@/views/coreDam/assetFileRoute/components/AssetFileRouteStatus.vue'
import {
  ACopyText,
  type AssetFile,
  type AssetFileMainRouteAware,
  type DamAssetTypeType,
  type DocId,
  useAlerts,
} from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
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

  <VMenu>
    <template #activator="{ props: activatorProps }">
      <VBtn
        variant="text"
        size="x-small"
        icon="mdi-dots-vertical"
        v-bind="activatorProps"
      />
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
          variant="listItem"
          button-t="coreDam.asset.assetFilePublicLink.actions.makePrivate"
          icon="mdi-lock"
          :loading="loading"
          @click.stop="makePrivate"
        />
      </template>
      <AssetFileRouteChangeBtn
        v-else
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
    @after-update="emit('mainRouteChanged')"
  />
</template>
