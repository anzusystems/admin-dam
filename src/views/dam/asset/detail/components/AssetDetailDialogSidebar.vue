<script setup lang="ts">
import AssetDetailSidebarMetadata from '@/views/dam/asset/detail/components/AssetDetailSidebarMetadata.vue'
import AssetDetailSidebarROI from '@/views/dam/asset/detail/components/AssetDetailSidebarROI.vue'
import { AssetDetailTab, useAssetDetailTab } from '@/composables/system/assetDetailTab'
import type { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import AssetDetailSidebarActionsTeleportTarget from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsTeleportTarget.vue'
import { useI18n } from 'vue-i18n'
import type { DocId } from '@anzusystems/common-admin'
import AssetInfobox from '@/views/dam/asset/components/AssetInfobox.vue'
import AssetDetailSidebarDistribution from '@/views/dam/asset/detail/components/distribution/AssetDetailSidebarDistribution.vue'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import AssetDetailSidebarPodcast from '@/views/dam/asset/detail/components/podcast/AssetDetailSidebarPodcast.vue'
import AssetDetailSidebarSlots from '@/views/dam/asset/detail/components/slots/AssetDetailSidebarSlots.vue'
import DistributionCategoryWidget from '@/views/dam/distributionCategory/components/DistributionCategoryWidget.vue'
import { AssetFileProcessStatus } from '@/types/dam/File'

const props = withDefaults(
  defineProps<{
    assetId: DocId
    isVideo: boolean
    isAudio: boolean
    isImage: boolean
    isDocument: boolean
    assetStatus: AssetStatus
    assetType: AssetType
    assetMainFileStatus?: AssetFileProcessStatus
  }>(),
  {
    assetMainFileStatus: undefined,
  }
)
const emit = defineEmits<{
  (e: 'postDelete', data: DocId): void
}>()

const postDelete = (data: DocId) => {
  emit('postDelete', data)
}

const { t } = useI18n({ useScope: 'global' })

const { activeTab } = useAssetDetailTab()

const typeHasDistributions = computed(() => {
  return damConfigExtSystem[props.assetType].distribution.distributionServices.length > 0
})
</script>

<template>
  <div class="sidebar-info d-flex w-100 h-100 flex-column">
    <div class="w-100 d-flex flex-column">
      <VTabs v-model="activeTab" class="sidebar-info__tabs">
        <VTab :value="AssetDetailTab.Info">{{ t('coreDam.asset.detail.tabs.info') }}</VTab>
        <VTab :value="AssetDetailTab.ROI" v-if="isImage">{{ t('coreDam.asset.detail.tabs.roi') }}</VTab>
        <VTab :value="AssetDetailTab.Distribution">
          {{ t('coreDam.asset.detail.tabs.distribution') }}
        </VTab>
        <VTab :value="AssetDetailTab.Podcast" v-if="isAudio">Podcast</VTab>
        <VTab :value="AssetDetailTab.Slots">{{ t('coreDam.asset.detail.tabs.slots') }}</VTab>
      </VTabs>

      <div class="sidebar-info__content">
        <AssetInfobox :asset-status="assetStatus" />
        <div class="py-2" v-if="activeTab === AssetDetailTab.Info">
          <AssetDetailSidebarMetadata :is-active="activeTab === AssetDetailTab.Info" @post-delete="postDelete" />
        </div>
        <div class="py-2" v-if="isImage && activeTab === AssetDetailTab.ROI">
          <AssetDetailSidebarROI :is-active="activeTab === AssetDetailTab.ROI" />
        </div>
        <div class="py-2" v-if="activeTab === AssetDetailTab.Distribution">
          <DistributionCategoryWidget class="px-4 mb-4" />
          <AssetDetailSidebarDistribution
            v-if="typeHasDistributions"
            :asset-id="assetId"
            :is-active="activeTab === AssetDetailTab.Distribution"
            :asset-type="assetType"
          />
        </div>
        <div class="py-2" v-if="isAudio && activeTab === AssetDetailTab.Podcast">
          <AssetDetailSidebarPodcast :asset-id="assetId" :is-active="activeTab === AssetDetailTab.Podcast" />
        </div>
        <div class="py-2" v-if="activeTab === AssetDetailTab.Slots">
          <AssetDetailSidebarSlots
            :asset-id="assetId"
            :is-active="activeTab === AssetDetailTab.Slots"
            :asset-type="assetType"
          />
        </div>
      </div>
      <div class="sidebar-info__actions px-2">
        <AssetDetailSidebarActionsTeleportTarget />
      </div>
    </div>
  </div>
</template>
