<script lang="ts" setup>
import { DamAssetType } from '@anzusystems/common-admin'
import { useAssetListActions } from '@/views/coreDam/asset/list/composables/assetListActions'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { setTypeAndFetch, togglePodcastAndFetch, filter } = useAssetListActions()

const isImageActive = computed(() => {
  return filter.type.model.includes(DamAssetType.Image)
})

const isAudioActive = computed(() => {
  return filter.type.model.includes(DamAssetType.Audio)
})

const isVideoActive = computed(() => {
  return filter.type.model.includes(DamAssetType.Video)
})

const isDocumentActive = computed(() => {
  return filter.type.model.includes(DamAssetType.Document)
})

const isPodcastActive = computed(() => {
  return filter.inPodcast.model === true
})
</script>

<template>
  <VBtn
    variant="text"
    icon
    size="x-small"
    class="mr-1"
    data-cy="button-all-types"
    @click.stop="setTypeAndFetch()"
  >
    <VIcon
      icon="mdi-multimedia"
      :size="16"
    />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('coreDam.asset.list.allTypes') }}
    </VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    class="mr-1"
    data-cy="button-image-types"
    :active="isImageActive"
    :color="isImageActive ? 'secondary' : ''"
    :variant="isImageActive ? 'flat' : 'text'"
    @click.stop="setTypeAndFetch(DamAssetType.Image)"
  >
    <VIcon
      icon="mdi-image"
      :size="16"
    />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('coreDam.asset.assetType.image') }}
    </VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    class="mr-1"
    data-cy="button-video-types"
    :active="isVideoActive"
    :color="isVideoActive ? 'secondary' : ''"
    :variant="isVideoActive ? 'flat' : 'text'"
    @click.stop="setTypeAndFetch(DamAssetType.Video)"
  >
    <VIcon
      icon="mdi-video"
      :size="16"
    />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('coreDam.asset.assetType.video') }}
    </VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    class="mr-1"
    data-cy="button-audio-types"
    :active="isAudioActive"
    :color="isAudioActive ? 'secondary' : ''"
    :variant="isAudioActive ? 'flat' : 'text'"
    @click.stop="setTypeAndFetch(DamAssetType.Audio)"
  >
    <VIcon
      icon="mdi-music"
      :size="16"
    />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('coreDam.asset.assetType.audio') }}
    </VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    data-cy="button-document-types"
    :active="isDocumentActive"
    :color="isDocumentActive ? 'secondary' : ''"
    :variant="isDocumentActive ? 'flat' : 'text'"
    @click.stop="setTypeAndFetch(DamAssetType.Document)"
  >
    <VIcon
      icon="mdi-note"
      :size="16"
    />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('coreDam.asset.assetType.document') }}
    </VTooltip>
  </VBtn>
  <VBtn
    icon
    size="x-small"
    data-cy="button-in-podcast-types"
    :active="isPodcastActive"
    :color="isPodcastActive ? 'secondary' : ''"
    :variant="isPodcastActive ? 'flat' : 'text'"
    @click.stop="togglePodcastAndFetch()"
  >
    <VIcon
      icon="mdi-podcast"
      :size="16"
    />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('coreDam.asset.filter.inPodcast') }}
    </VTooltip>
  </VBtn>
</template>
