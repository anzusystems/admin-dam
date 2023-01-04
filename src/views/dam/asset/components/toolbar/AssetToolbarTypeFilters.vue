<script lang="ts" setup>
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { useAssetListActions } from '@/views/dam/asset/list/composables/assetListActions'
import { computed } from 'vue'

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
    <VTooltip activator="parent" location="bottom">All</VTooltip>
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
    <VTooltip activator="parent" location="bottom">Image</VTooltip>
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
    <VTooltip activator="parent" location="bottom">Video</VTooltip>
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
    <VTooltip activator="parent" location="bottom">Audio</VTooltip>
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
    <VTooltip activator="parent" location="bottom">Document</VTooltip>
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
    <VTooltip activator="parent" location="bottom">Audio Podcast</VTooltip>
  </VBtn>
</template>
