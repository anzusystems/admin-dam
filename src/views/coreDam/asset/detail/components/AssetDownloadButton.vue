<script lang="ts" setup>
import { ref } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
import { eventClickBlur } from '@anzusystems/common-admin'
import { fileDownloadLink } from '@/services/api/coreDam/fileApi'
import AssetDetailSlotSelect from '@/views/coreDam/asset/detail/components/AssetDetailSlotSelect.vue'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    assetType: AssetType
  }>(),
  {}
)

const { t } = useI18n()

const dialog = ref(false)
const loading = ref(false)
const link = ref<string | null>(null)

const assetDetailStore = useAssetDetailStore()

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
  const res = await fileDownloadLink(props.assetType, fileId)
  link.value = res.link
  loading.value = false
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
  <VBtn icon size="small" variant="text" @click.stop="onClick">
    <VIcon icon="mdi-download" />
    <VTooltip activator="parent" location="bottom">{{ t('common.button.download') }}</VTooltip>
  </VBtn>
  <VDialog v-model="dialog" persistent :width="500" no-click-animation>
    <VCard v-if="dialog" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t('common.button.download') }}</div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            data-cy="button-close"
            @click.stop="onCancel"
          />
        </VToolbarItems>
      </VToolbar>
      <VCardText>
        <AssetDetailSlotSelect @active-slot-change="activeSlotChange" />
        <div v-if="loading" class="w-100 h-100 d-flex align-center justify-center">
          <VProgressCircular indeterminate color="primary" />
        </div>
        <div v-else-if="link" class="w-100 text-center mt-4">
          <VBtn color="primary" prepend-icon="mdi-download" :href="link">
            {{ t('system.download.downloadOriginalFile') }}
          </VBtn>
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn text data-cy="button-cancel" @click.stop="onCancel">{{ t('common.button.close') }}</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
