<script lang="ts" setup>
import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { ADialogToolbar, eventClickBlur, useAlerts } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fileDownloadLink } from '@/domains/coreDam/asset/api/fileApi'
import AssetDetailSlotSelect from '@/domains/coreDam/asset/components/detail/components/AssetDetailSlotSelect.vue'
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

/*
 * Counts link requests: the slot can change or the dialog reopen
 * while one is in flight, and an older answer can arrive last.
 * Only the latest request sets the link, and the dialog spins until it is answered.
 */
let latestLinkRequest = 0

const updateLink = async (fileId: DocId) => {
  const asked = ++latestLinkRequest
  loading.value = true
  link.value = null
  try {
    const res = await fileDownloadLink(props.assetType, fileId)
    if (asked === latestLinkRequest) link.value = res.link
  } catch (e) {
    if (asked !== latestLinkRequest) return
    // Shows the server's refusal reason, otherwise an unknown error.
    if (!showErrorsDefault(e)) showUnknownError()
  } finally {
    if (asked === latestLinkRequest) loading.value = false
  }
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
    :aria-label="t('common.button.download')"
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
          <!--
            Opens in a new tab: the address is signed for a limited time.
            A storage that refuses it or is down shows its own page, which stays out of this app.
          -->
          <VBtn
            color="primary"
            prepend-icon="mdi-download"
            :href="link"
            target="_blank"
            rel="noopener noreferrer"
            data-cy="button-download-file"
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
