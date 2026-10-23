<script setup lang="ts">
import { useTheme } from '@anzusystems/common-admin'
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AssetFooterSelectedButtonClear from '@/domains/coreDam/asset/components/footer/AssetFooterSelectedButtonClear.vue'
import AssetQueueMassEditSimple from '@/domains/coreDam/asset/components/queue/AssetQueueSelectedSimple.vue'
import { FooterViewSelected, useAssetFooterSelectedView } from '@/domains/coreDam/asset/composables/assetFooterSelected'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'

const { t } = useI18n()

const { toolbarColor } = useTheme()

const {
  autoShowSelected,
  hideSelected,
  footerViewSelected,
  showFullSelected,
  setFullSelected,
  showMinimalSelected,
  setMinimalSelected,
  showCompactSelected,
  setCompactSelected,
} = useAssetFooterSelectedView()
const uploadQueuesStore = useUploadQueuesStore()
const assetListStore = useAssetListStore()

const queueTotalCount = computed(() => uploadQueuesStore.getQueueTotalCount(QUEUE_ID_MASS_EDIT))

watch(queueTotalCount, (newValue, oldValue) => {
  if (newValue === oldValue) return
  if (newValue > 0) {
    autoShowSelected()
    return
  }
  if (newValue === 0) {
    hideSelected()
    return
  }
})

/* Drawn anew after the count dropped to 0 while a queue drawn over the whole page stood in its place - its row of an
 * asset deleted - the watch was not there to see it: no strip of nothing picked. */
onMounted(() => {
  if (queueTotalCount.value === 0 && footerViewSelected.value !== FooterViewSelected.Hidden) hideSelected()
})

const onClearConfirm = async () => {
  uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)
  assetListStore.clearSelected()
  hideSelected()
}
</script>

<template>
  <div
    class="asset-footer__selected pa-0"
    :class="'asset-footer--' + footerViewSelected + ' asset-footer__selected--' + footerViewSelected"
  >
    <div class="d-flex w-100 h-100 flex-column">
      <VToolbar
        class="w-100"
        :color="toolbarColor"
        density="compact"
        :height="48"
      >
        <div class="d-flex px-2">
          <div>
            <span class="text-body-small font-weight-bold">
              {{ t('coreDam.asset.selected.selectedFiles') }}: {{ queueTotalCount }}
            </span>
          </div>
        </div>
        <VSpacer />
        <div class="d-flex">
          <VBtn
            v-show="showFullSelected"
            color="primary"
            variant="flat"
            :height="26"
            class="mr-2"
            @click.stop="setFullSelected"
          >
            {{ t('coreDam.asset.selected.edit') }}
          </VBtn>
          <AssetFooterSelectedButtonClear
            v-show="showFullSelected"
            variant="small"
            @confirm="onClearConfirm"
          />
          <VBtn
            v-show="showMinimalSelected"
            :aria-label="t('common.system.modal.hide')"
            icon
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-2"
            @click.stop="setMinimalSelected"
          >
            <VIcon icon="mdi-chevron-down" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('common.system.modal.hide') }}
            </VTooltip>
          </VBtn>
          <VBtn
            v-show="showCompactSelected"
            :aria-label="t('common.system.modal.show')"
            icon
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-2"
            @click.stop="setCompactSelected"
          >
            <VIcon icon="mdi-chevron-up" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('common.system.modal.show') }}
            </VTooltip>
          </VBtn>
        </div>
      </VToolbar>
      <AssetQueueMassEditSimple />
    </div>
  </div>
</template>
