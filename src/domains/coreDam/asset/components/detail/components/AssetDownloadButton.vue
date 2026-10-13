<script lang="ts" setup>
import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { ADialogToolbar, eventClickBlur, useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fileDownloadLink } from '@/domains/coreDam/asset/api/fileApi'
import AssetDetailSlotSelect from '@/domains/coreDam/asset/components/detail/components/AssetDetailSlotSelect.vue'
import { useFileDownloadUnload } from '@/domains/coreDam/asset/composables/fileDownloadUnload'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)

const { t } = useI18n()

const dialog = ref(false)
const loading = ref(false)
const link = ref<string | null>(null)

const assetDetailStore = useAssetDetailStore()
const { downloadPressed } = useFileDownloadUnload()
const { showErrorsDefault, showUnknownError } = useAlerts()

const initData = async () => {
  if (assetDetailStore.asset && assetDetailStore.asset.mainFile) {
    await updateLink(assetDetailStore.asset.mainFile.id)
  }
}

const onClick = async (event: Event) => {
  eventClickBlur(event)
  dialog.value = true
  link.value = null
  await initData()
}

const updateLink = async (fileId: DocId) => {
  loading.value = true
  link.value = null
  try {
    const res = await fileDownloadLink(props.assetType, fileId)
    link.value = res.link
  } catch (e) {
    // The request rejects with what axios threw, or with nothing at all: neither is an error the alerts know.
    if (!showErrorsDefault(e)) showUnknownError()
  } finally {
    loading.value = false
  }
}

/* The browser announces an unload only for the press it follows in this tab: with a modifier key held, or by
 * another button, the link opens elsewhere or is saved, and the page hears nothing of it. The conditions are the
 * router's own, as for the edit link of a row of the table. */
const onLinkPress = (event: MouseEvent) => {
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  downloadPressed()
}

const activeSlotChange = async (slot: null | AssetSlot) => {
  if (!slot || !slot.assetFile) return
  await updateLink(slot.assetFile.id)
}

const closeDialog = () => {
  dialog.value = false
}

const onCancel = () => {
  closeDialog()
}
</script>

<template>
  <VBtn
    icon
    size="small"
    variant="text"
    data-cy="button-download"
    @click.stop="onClick"
  >
    <VIcon icon="mdi-download" />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('common.button.download') }}
    </VTooltip>
  </VBtn>
  <VDialog
    v-model="dialog"
    :width="500"
  >
    <VCard
      v-if="dialog"
      data-cy="delete-panel"
    >
      <ADialogToolbar @cancel="onCancel">
        {{ t('common.button.download') }}
      </ADialogToolbar>
      <VCardText>
        <AssetDetailSlotSelect @active-slot-change="activeSlotChange" />
        <div
          v-if="loading"
          class="w-100 h-100 d-flex align-center justify-center"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>
        <div
          v-else-if="link"
          class="w-100 text-center mt-4"
        >
          <VBtn
            color="primary"
            prepend-icon="mdi-download"
            :href="link"
            data-cy="button-download-file"
            @click="onLinkPress"
          >
            {{ t('system.download.downloadOriginalFile') }}
          </VBtn>
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.close') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
