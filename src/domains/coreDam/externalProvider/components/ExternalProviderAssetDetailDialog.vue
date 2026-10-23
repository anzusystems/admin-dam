<script setup lang="ts">
import { ADamAssetImage, DamAssetType, isNull, useTheme } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import AssetDetailDialogLoader from '@/domains/coreDam/asset/components/detail/components/AssetDetailDialogLoader.vue'
import { useDetailInfoPanel } from '@/domains/coreDam/asset/components/detail/composables/detailInfoPanel'
import ExternalProviderAssetDetailDialogSidebar from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetDetailDialogSidebar.vue'
import {
  EXTERNAL_PROVIDER_DETAIL_DIALOG_CLASS,
  useExternalProviderAssetListActions,
} from '@/domains/coreDam/externalProvider/composables/externalProviderAssetListActions'
import { useExternalProviderAssetDetailStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetDetailStore'
import { useExternalProviderAssetListStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetListStore'

const emit = defineEmits<{ nextItem: []; prevItem: [] }>()

const { t } = useI18n()

const { toolbarColor } = useTheme()

const imageLoading = ref(true)

const externalProviderAssetDetailStore = useExternalProviderAssetDetailStore()
const externalProviderAssetListStore = useExternalProviderAssetListStore()
const { pagination, neighbourOfActive } = useExternalProviderAssetListActions() //todo
const { asset } = storeToRefs(externalProviderAssetDetailStore)

const closeDialog = () => {
  externalProviderAssetListStore.keyboardNavigationEnable()
  externalProviderAssetDetailStore.hideDetail()
  imageLoading.value = true
}

const sidebar = ref(true)
const { wide, panelId } = useDetailInfoPanel()

const toggleSidebar = () => {
  sidebar.value = !sidebar.value
}

const onImageLoad = () => {
  imageLoading.value = false
}

const nextItem = () => {
  emit('nextItem')
}
const prevItem = () => {
  emit('prevItem')
}

const assetType = computed(() => asset.value?.attributes.assetType)

const isTypeImage = computed(() => assetType.value === DamAssetType.Image)
const isTypeVideo = computed(() => assetType.value === DamAssetType.Video)
const isTypeAudio = computed(() => assetType.value === DamAssetType.Audio)
const isTypeDocument = computed(() => assetType.value === DamAssetType.Document)
const imageSrc = computed(() => {
  if (asset.value?.url) {
    return asset.value.url
  }
  return placeholder16x9
})
const toolbarTitle = computed(() => {
  if (!asset.value) return ''
  return asset.value.texts.displayTitle
})
// Behind the loader the name of the asset being read: every read of this detail is of the active tile.
const loaderTitle = computed(() => {
  const active = externalProviderAssetListStore.activeItemIndex
  if (isNull(active)) return ''

  return externalProviderAssetListStore.list[active]?.asset.texts.displayTitle ?? ''
})
const totalCountText = computed(() => {
  if (isNull(externalProviderAssetListStore.activeItemIndex)) return ''
  return (
    externalProviderAssetListStore.activeItemIndex +
    1 +
    ' / ' +
    externalProviderAssetListStore.list.length +
    (pagination.value.hasNextPage ? '+' : '')
  )
})
</script>

<template>
  <VDialog
    v-model="externalProviderAssetDetailStore.detail"
    fullscreen
    :class="EXTERNAL_PROVIDER_DETAIL_DIALOG_CLASS"
  >
    <!-- The bar of the loaded detail below: its two buttons are there always, each disabled at its end of the list. -->
    <AssetDetailDialogLoader
      v-if="externalProviderAssetDetailStore.loader"
      walks-list
      :prev-disabled="!neighbourOfActive(-1)"
      :next-disabled="!neighbourOfActive(1)"
      :total-count-text="totalCountText"
      :title="loaderTitle"
      @prev-item="prevItem"
      @next-item="nextItem"
      @close-dialog="closeDialog"
    />
    <VCard
      v-else-if="asset"
      class="dam-image-detail"
      :class="{ 'dam-image-detail--sidebar-active': sidebar }"
    >
      <div class="dam-image-detail__wrapper d-flex flex-column">
        <VToolbar
          :color="toolbarColor"
          density="compact"
          :height="64"
          class="border-b"
        >
          <div>
            <VBtn
              :aria-label="t('coreDam.asset.list.prev')"
              variant="text"
              icon
              class="mx-1"
              :width="36"
              :height="36"
              :disabled="!neighbourOfActive(-1)"
              @click.stop="prevItem"
            >
              <VIcon icon="mdi-chevron-left" />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.list.prev') }}
              </VTooltip>
            </VBtn>
            <VBtn
              :aria-label="t('coreDam.asset.list.next')"
              variant="text"
              icon
              class="mr-2"
              :width="36"
              :height="36"
              :disabled="!neighbourOfActive(1)"
              @click.stop="nextItem"
            >
              <VIcon icon="mdi-chevron-right" />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.list.next') }}
              </VTooltip>
            </VBtn>
          </div>
          <div class="text-label-large d-flex">
            <div class="pr-4">
              {{ totalCountText }}
            </div>
            <div>{{ toolbarTitle }}</div>
          </div>
          <VSpacer />
          <div>
            <VBtn
              :aria-label="t('coreDam.asset.detail.toggleInfo')"
              :aria-expanded="wide ? sidebar : undefined"
              :aria-controls="wide ? panelId : undefined"
              :active="sidebar"
              :variant="sidebar ? 'flat' : 'text'"
              :color="sidebar ? 'secondary' : ''"
              icon
              class="mr-1"
              :width="36"
              :height="36"
              @click.stop="toggleSidebar"
            >
              <!-- Narrower than 840 px the button shows and hides the picture above the panel: an image
                   icon there, as in the library's detail. -->
              <VIcon
                icon="mdi-information-outline"
                class="d-none d-md-flex"
              />
              <VIcon
                icon="mdi-image-outline"
                class="d-flex d-md-none"
              />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.detail.toggleInfo') }}
              </VTooltip>
            </VBtn>
            <VBtn
              :aria-label="t('common.button.close')"
              icon
              variant="text"
              :width="36"
              :height="36"
              class="mr-1"
              @click.stop="closeDialog"
            >
              <VIcon icon="mdi-close" />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('common.button.close') }}
              </VTooltip>
            </VBtn>
          </div>
        </VToolbar>
        <div class="d-flex w-100 h-100 position-relative dam-image-detail__content">
          <div class="d-flex w-100 align-center dam-image-detail__left">
            <div class="w-100 h-100 pa-2 d-flex align-center justify-center">
              <div
                v-if="imageLoading && isTypeImage"
                class="d-flex w-100 h-100 align-center justify-center"
              >
                <VProgressCircular
                  indeterminate
                  color="white"
                />
              </div>
              <ADamAssetImage
                :src="imageSrc"
                use-component
                @load="onImageLoad"
                @error="onImageLoad"
              />
            </div>
          </div>
          <div
            :id="panelId"
            class="h-100 d-flex dam-image-detail__sidebar border-s"
            :inert="wide && !sidebar"
          >
            <ExternalProviderAssetDetailDialogSidebar
              :is-video="isTypeVideo"
              :is-audio="isTypeAudio"
              :is-image="isTypeImage"
              :is-document="isTypeDocument"
            />
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>
