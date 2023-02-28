<script setup lang="ts">
import AssetDetailSidebarMetadata from '@/views/coreDam/asset/detail/components/AssetDetailSidebarMetadata.vue'
import AssetDetailSidebarROI from '@/views/coreDam/asset/detail/components/AssetDetailSidebarROI.vue'
import { AssetDetailTab, useAssetDetailTab } from '@/composables/system/assetDetailTab'
import type { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import AssetDetailSidebarActionsTeleportTarget
  from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsTeleportTarget.vue'
import { useI18n } from 'vue-i18n'
import type { DocId } from '@anzusystems/common-admin'
import AssetInfobox from '@/views/coreDam/asset/components/AssetInfobox.vue'
import AssetDetailSidebarDistribution
  from '@/views/coreDam/asset/detail/components/distribution/AssetDetailSidebarDistribution.vue'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import AssetDetailSidebarPodcast from '@/views/coreDam/asset/detail/components/podcast/AssetDetailSidebarPodcast.vue'
import AssetDetailSidebarSlots from '@/views/coreDam/asset/detail/components/slots/AssetDetailSidebarSlots.vue'
import DistributionCategoryWidget from '@/views/coreDam/distributionCategory/components/DistributionCategoryWidget.vue'
import type { AssetFileProcessStatus } from '@/types/coreDam/File'
import AssetDetailSidebarImagePreview from '@/views/coreDam/asset/detail/components/AssetDetailSidebarImagePreview.vue'
import AssetDetailSidebarVideoShow
  from '@/views/coreDam/asset/detail/components/videoShow/AssetDetailSidebarVideoShow.vue'

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

const { t } = useI18n()

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
        <VTab v-if="isImage" :value="AssetDetailTab.ROI">{{ t('coreDam.asset.detail.tabs.roi') }}</VTab>
        <VTab v-if="typeHasDistributions" :value="AssetDetailTab.Distribution">
          {{ t('coreDam.asset.detail.tabs.distribution') }}
        </VTab>
        <VTab v-if="isAudio" :value="AssetDetailTab.Podcast">{{ t('coreDam.asset.detail.tabs.podcast') }}</VTab>
        <VTab v-if="isVideo" :value="AssetDetailTab.VideoShow">{{ t('coreDam.asset.detail.tabs.videoShow') }}</VTab>
        <VTab :value="AssetDetailTab.Slots">{{ t('coreDam.asset.detail.tabs.slots') }}</VTab>
        <VTab v-if="isVideo" :value="AssetDetailTab.ImagePreview">{{
          t('coreDam.asset.detail.tabs.imagePreview')
        }}</VTab>
      </VTabs>

      <div class="sidebar-info__content">
        <AssetInfobox :asset-status="assetStatus" />
        <div v-if="activeTab === AssetDetailTab.Info" class="py-2">
          <AssetDetailSidebarMetadata
            :is-active="activeTab === AssetDetailTab.Info"
            :asset-type="assetType"
            @post-delete="postDelete"
          />
        </div>
        <div v-if="isImage && activeTab === AssetDetailTab.ROI" class="py-2">
          <AssetDetailSidebarROI :is-active="activeTab === AssetDetailTab.ROI" />
        </div>
        <div v-if="typeHasDistributions && activeTab === AssetDetailTab.Distribution" class="py-2">
          <DistributionCategoryWidget class="px-4 mb-4" />
          <AssetDetailSidebarDistribution
            :asset-id="assetId"
            :is-active="activeTab === AssetDetailTab.Distribution"
            :asset-type="assetType"
          />
        </div>
        <div v-if="isAudio && activeTab === AssetDetailTab.Podcast" class="py-2">
          <AssetDetailSidebarPodcast :asset-id="assetId" :is-active="activeTab === AssetDetailTab.Podcast" />
        </div>
        <div v-if="isVideo && activeTab === AssetDetailTab.VideoShow" class="py-2">
          <AssetDetailSidebarVideoShow :asset-id="assetId" :is-active="activeTab === AssetDetailTab.VideoShow" />
        </div>
        <div v-if="activeTab === AssetDetailTab.Slots" class="py-2">
          <AssetDetailSidebarSlots
            :asset-id="assetId"
            :is-active="activeTab === AssetDetailTab.Slots"
            :asset-type="assetType"
          />
        </div>
        <div v-if="isVideo && activeTab === AssetDetailTab.ImagePreview" class="py-2">
          <AssetDetailSidebarImagePreview :is-active="activeTab === AssetDetailTab.ImagePreview" />
        </div>
      </div>
      <div class="sidebar-info__actions px-2">
        <AssetDetailSidebarActionsTeleportTarget />
      </div>
    </div>
  </div>
</template>