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

/* The requests for the address of a file, counted: the slot can be changed in the select, or the dialog closed and
 * opened again, while one is on its way, and the answer of the older can come last - the link would then be of
 * another file than the select says. Only the one asked for last sets the link, and the dialog spins until that one
 * is answered. */
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
    // The request rejects with what axios threw, or with nothing at all: neither is an error the alerts know.
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
          <!-- In another tab: the address is signed for a while only, and a storage that refuses it, or is down,
               answers with a page of its own. That page stays in the other tab, and the application here. -->
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
