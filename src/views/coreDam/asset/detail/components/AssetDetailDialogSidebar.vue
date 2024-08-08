<script setup lang="ts">
import AssetDetailSidebarMetadata from '@/views/coreDam/asset/detail/components/AssetDetailSidebarMetadata.vue'
import AssetDetailSidebarROI from '@/views/coreDam/asset/detail/components/AssetDetailSidebarROI.vue'
import { AssetDetailTab, useAssetDetailTab } from '@/composables/system/assetDetailTab'
import { type DamAssetStatus, type DamAssetType, isUndefined } from '@anzusystems/common-admin'
import {
  type AssetFileFailReason,
  type AssetFileProcessStatus,
  type DocId,
  useDamConfigState,
} from '@anzusystems/common-admin'
import AssetDetailSidebarActionsTeleportTarget from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsTeleportTarget.vue'
import { useI18n } from 'vue-i18n'
import AssetInfobox from '@/views/coreDam/asset/components/AssetInfobox.vue'
import AssetDetailSidebarDistribution from '@/views/coreDam/asset/detail/components/distribution/AssetDetailSidebarDistribution.vue'
import { computed } from 'vue'
import AssetDetailSidebarPodcast from '@/views/coreDam/asset/detail/components/podcast/AssetDetailSidebarPodcast.vue'
import AssetDetailSidebarSlots from '@/views/coreDam/asset/detail/components/slots/AssetDetailSidebarSlots.vue'
import DistributionCategoryWidget from '@/views/coreDam/distributionCategory/components/DistributionCategoryWidget.vue'
import AssetDetailSidebarImagePreview from '@/views/coreDam/asset/detail/components/AssetDetailSidebarImagePreview.vue'
import AssetDetailSidebarVideoShow from '@/views/coreDam/asset/detail/components/videoShow/AssetDetailSidebarVideoShow.vue'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'
import { ACL } from '@/composables/auth/auth'

const props = withDefaults(
  defineProps<{
    assetId: DocId
    isVideo: boolean
    isAudio: boolean
    isImage: boolean
    isDocument: boolean
    dataCy?: string
    assetStatus: DamAssetStatus
    assetType: DamAssetType
    assetMainFileStatus?: AssetFileProcessStatus | undefined
    assetMainFileFailReason?: AssetFileFailReason | undefined
  }>(),
  {
    assetMainFileStatus: undefined,
    assetMainFileFailReason: undefined,
    dataCy: undefined,
  }
)
const emit = defineEmits<{
  (e: 'postDelete', data: DocId): void
  (e: 'mainRouteChanged'): void
}>()

const postDelete = (data: DocId) => {
  emit('postDelete', data)
}

const { t } = useI18n()

const { activeTab } = useAssetDetailTab()

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const typeHasDistributions = computed(() => {
  return configExtSystem[props.assetType].distribution.distributionServices.length > 0
})
</script>

<template>
  <div class="sidebar-info d-flex w-100 h-100 flex-column">
    <div class="w-100 d-flex flex-column">
      <VTabs
        v-model="activeTab"
        show-arrows
        class="sidebar-info__tabs"
      >
        <VTab
          :value="AssetDetailTab.Info"
          data-cy="button-meta"
        >
          {{ t('coreDam.asset.detail.tabs.info') }}
        </VTab>
        <VTab
          v-if="isImage"
          :value="AssetDetailTab.ROI"
          data-cy="button-focus"
        >
          {{ t('coreDam.asset.detail.tabs.roi') }}
        </VTab>
        <Acl :permission="ACL.DAM_DISTRIBUTION_ACCESS">
          <VTab
            v-if="typeHasDistributions"
            :value="AssetDetailTab.Distribution"
            data-cy="button-distribution"
          >
            {{ t('coreDam.asset.detail.tabs.distribution') }}
          </VTab>
        </Acl>
        <VTab
          v-if="isAudio"
          :value="AssetDetailTab.Podcast"
          data-cy="button-podcast"
        >
          {{ t('coreDam.asset.detail.tabs.podcast') }}
        </VTab>
        <VTab
          v-if="isVideo"
          :value="AssetDetailTab.VideoShow"
          data-cy="button-video-show"
        >
          {{ t('coreDam.asset.detail.tabs.videoShow') }}
        </VTab>
        <VTab
          :value="AssetDetailTab.Slots"
          data-cy="button-slots"
        >
          {{ t('coreDam.asset.detail.tabs.slots') }}
        </VTab>
        <VTab
          v-if="isVideo"
          :value="AssetDetailTab.ImagePreview"
          data-cy="button-image-preview"
        >
          {{ t('coreDam.asset.detail.tabs.imagePreview') }}
        </VTab>
      </VTabs>

      <div class="sidebar-info__content">
        <AssetInfobox
          :asset-status="assetStatus"
          :asset-main-file-status="assetMainFileStatus"
          :asset-main-file-fail-reason="assetMainFileFailReason"
        />
        <div
          v-if="activeTab === AssetDetailTab.Info"
          class="py-2"
        >
          <AssetDetailSidebarMetadata
            :is-active="activeTab === AssetDetailTab.Info"
            :asset-type="assetType"
            @post-delete="postDelete"
            @main-route-changed="emit('mainRouteChanged')"
          />
        </div>
        <div
          v-if="isImage && activeTab === AssetDetailTab.ROI"
          class="py-2"
        >
          <AssetDetailSidebarROI :is-active="activeTab === AssetDetailTab.ROI" />
        </div>
        <Acl :permission="ACL.DAM_DISTRIBUTION_ACCESS">
          <div
            v-if="typeHasDistributions && activeTab === AssetDetailTab.Distribution"
            class="py-2"
          >
            <DistributionCategoryWidget class="px-4 mb-4" />
            <AssetDetailSidebarDistribution
              :asset-id="assetId"
              :is-active="activeTab === AssetDetailTab.Distribution"
              :asset-type="assetType"
              :asset-main-file-status="assetMainFileStatus"
            />
          </div>
        </Acl>
        <div
          v-if="isAudio && activeTab === AssetDetailTab.Podcast"
          class="py-2"
        >
          <AssetDetailSidebarPodcast
            :asset-id="assetId"
            :is-active="activeTab === AssetDetailTab.Podcast"
          />
        </div>
        <div
          v-if="isVideo && activeTab === AssetDetailTab.VideoShow"
          class="py-2"
        >
          <AssetDetailSidebarVideoShow
            :asset-id="assetId"
            :is-active="activeTab === AssetDetailTab.VideoShow"
          />
        </div>
        <div
          v-if="activeTab === AssetDetailTab.Slots"
          class="py-2"
        >
          <AssetDetailSidebarSlots
            :asset-id="assetId"
            :is-active="activeTab === AssetDetailTab.Slots"
            :asset-type="assetType"
          />
        </div>
        <div
          v-if="isVideo && activeTab === AssetDetailTab.ImagePreview"
          class="py-2"
        >
          <AssetDetailSidebarImagePreview :is-active="activeTab === AssetDetailTab.ImagePreview" />
        </div>
      </div>
      <div class="sidebar-info__actions px-2">
        <AssetDetailSidebarActionsTeleportTarget />
      </div>
    </div>
  </div>
</template>
