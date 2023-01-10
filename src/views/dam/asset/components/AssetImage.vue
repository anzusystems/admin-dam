<script lang="ts" setup>
import { computed } from 'vue'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    assetType?: AssetType
    assetStatus?: AssetStatus
    src: string
    backgroundColor?: string
    width?: number
    height?: number
    fallbackHeight?: number
    iconSize?: number
    useComponent?: boolean
    cover?: boolean
    aspectRatio?: number
    showUploading?: boolean
    showProcessing?: boolean
    showWaiting?: boolean
    uploadingColor?: string
    processingColor?: string
    uploadingProgress?: number | null
  }>(),
  {
    assetType: AssetType.Image,
    assetStatus: AssetStatus.WithFile,
    backgroundColor: '#ccc',
    width: undefined,
    height: undefined,
    fallbackHeight: 200,
    iconSize: 80,
    useComponent: false,
    cover: false,
    aspectRatio: undefined,
    showUploading: false,
    showProcessing: false,
    showWaiting: false,
    uploadingColor: 'primary',
    processingColor: 'primary',
    uploadingProgress: null,
  }
)
const emit = defineEmits<{
  (e: 'load'): void
  (e: 'error'): void
}>()

const { t } = useI18n({ useScope: 'global' })

const onLoad = () => {
  emit('load')
}
const onError = () => {
  emit('error')
}

const icon = computed(() => {
  if (props.assetStatus === AssetStatus.Deleting) return 'mdi-trash-can'
  switch (props.assetType) {
    case AssetType.Audio:
      return props.assetStatus === AssetStatus.WithFile ? 'mdi-music' : 'mdi-music-off'
    case AssetType.Document:
      return props.assetStatus === AssetStatus.WithFile ? 'mdi-note' : 'mdi-note-off'
    case AssetType.Video:
      return props.assetStatus === AssetStatus.WithFile ? 'mdi-video' : 'mdi-video-off'
    case AssetType.Image:
      return props.assetStatus === AssetStatus.WithFile ? 'mdi-image' : 'mdi-image-off'
    default:
      return ''
  }
})

const uploadingPercentage = computed(() => {
  if (!props.uploadingProgress) return '0%'
  const value = Math.ceil(props.uploadingProgress)
  return value > 100 ? '100%' : value + '%'
})

const backgroundColorComputed = computed(() => {
  return [AssetStatus.Deleting, AssetStatus.Draft].includes(props.assetStatus) ? '#ccc' : props.backgroundColor
})

const iconColor = computed(() => {
  return props.assetStatus === AssetStatus.WithFile ? '#363636' : '#8f8f8f'
})
</script>

<template>
  <VImg
    v-if="showUploading || showProcessing || showWaiting"
    :aspect-ratio="aspectRatio"
    :src="src"
    :width="width"
    :height="height"
    :cover="cover"
    @error="onError"
    @load="onLoad"
    class="asset-image-loading-bg"
  >
    <template v-slot:default>
      <div class="d-flex w-100 h-100 align-center justify-center" v-if="showWaiting">
        <div class="f-flex flex-column text-center">
          <VProgressCircular indeterminate :size="iconSize" :width="iconSize / 10" class="ml-auto mr-auto">
          </VProgressCircular>
          <br />
          <span class="text-caption">{{ t('common.upload.waiting') }}</span>
        </div>
      </div>
      <div class="d-flex w-100 h-100 align-center justify-center" v-if="showProcessing">
        <div class="f-flex flex-column text-center">
          <VProgressCircular
            :color="processingColor"
            indeterminate
            :size="iconSize"
            :width="iconSize / 10"
            class="ml-auto mr-auto"
          ></VProgressCircular>
          <br />
          <span class="text-caption">{{ t('common.upload.processing') }}</span>
        </div>
      </div>
      <div class="d-flex w-100 h-100 align-center justify-center" v-else-if="showUploading">
        <div class="f-flex flex-column text-center">
          <VProgressCircular
            :color="uploadingColor"
            :size="iconSize"
            :width="iconSize / 10"
            class="ml-auto mr-auto"
            :model-value="uploadingProgress === null ? undefined : uploadingProgress"
          >
            {{ uploadingPercentage }}
          </VProgressCircular>
          <br />
          <span class="text-caption">{{ t('common.upload.uploading') }}</span>
        </div>
      </div>
    </template>
  </VImg>
  <VImg
    v-else-if="assetStatus === AssetStatus.WithFile && assetType === AssetType.Image && useComponent"
    :src="src"
    @load="onLoad"
    @error="onError"
    :width="width"
    :height="height"
    class="asset-image asset-image--component"
    :cover="cover"
    :aspect-ratio="aspectRatio"
  ></VImg>
  <img
    v-else-if="assetStatus === AssetStatus.WithFile && assetType === AssetType.Image"
    :src="src"
    :width="width"
    :height="height"
    alt=""
    :style="'background-color:' + backgroundColorComputed"
    class="asset-image"
  />
  <div
    v-else
    :style="{ height: fallbackHeight + 'px', backgroundColor: backgroundColorComputed }"
    style="width: 100%"
    class="asset-image asset-image--placeholder d-flex align-center justify-center"
  >
    <VIcon :size="iconSize" v-if="icon.length" :icon="icon" :color="iconColor"></VIcon>
  </div>
</template>
