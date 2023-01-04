<script lang="ts" setup>
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { useAssetListActions } from '@/views/dam/asset/list/composables/assetListActions'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const { setTypeAndFetch, togglePodcastAndFetch, filter } = useAssetListActions()

const isImageActive = computed(() => {
  return filter.type.model.includes(AssetType.Image)
})

const isAudioActive = computed(() => {
  return filter.type.model.includes(AssetType.Audio)
})

const isVideoActive = computed(() => {
  return filter.type.model.includes(AssetType.Video)
})

const isDocumentActive = computed(() => {
  return filter.type.model.includes(AssetType.Document)
})

const isPodcastActive = computed(() => {
  return filter.inPodcast.model === true
})
</script>

<template>
  <VBtn variant="text" icon size="x-small" class="mr-1" @click.stop="setTypeAndFetch()">
    <VIcon icon="mdi-multimedia" :size="16" />
    <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.allTypes') }}</VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    class="mr-1"
    :active="isImageActive"
    @click.stop="setTypeAndFetch(AssetType.Image)"
    :color="isImageActive ? 'secondary' : ''"
    :variant="isImageActive ? 'flat' : 'text'"
  >
    <VIcon icon="mdi-image" :size="16" />
    <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.assetType.image') }}</VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    class="mr-1"
    :active="isVideoActive"
    @click.stop="setTypeAndFetch(AssetType.Video)"
    :color="isVideoActive ? 'secondary' : ''"
    :variant="isVideoActive ? 'flat' : 'text'"
  >
    <VIcon icon="mdi-video" :size="16" />
    <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.assetType.video') }}</VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    class="mr-1"
    :active="isAudioActive"
    @click.stop="setTypeAndFetch(AssetType.Audio)"
    :color="isAudioActive ? 'secondary' : ''"
    :variant="isAudioActive ? 'flat' : 'text'"
  >
    <VIcon icon="mdi-music" :size="16" />
    <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.assetType.audio') }}</VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    :active="isDocumentActive"
    @click.stop="setTypeAndFetch(AssetType.Document)"
    :color="isDocumentActive ? 'secondary' : ''"
    :variant="isDocumentActive ? 'flat' : 'text'"
  >
    <VIcon icon="mdi-note" :size="16" />
    <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.assetType.document') }}</VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    :active="isPodcastActive"
    @click.stop="togglePodcastAndFetch()"
    :color="isPodcastActive ? 'secondary' : ''"
    :variant="isPodcastActive ? 'flat' : 'text'"
  >
    <VIcon icon="mdi-podcast" :size="16" />
    <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.filter.inPodcast') }}</VTooltip>
  </VBtn>
</template>
