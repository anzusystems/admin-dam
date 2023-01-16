<script lang="ts" setup>
import { computed, watch } from 'vue'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import { useI18n } from 'vue-i18n'
import { isUndefined } from '@/utils/common'
import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'

const props = withDefaults(
  defineProps<{
    assetType?: AssetType
    assetStatus?: AssetStatus
    src?: string
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
    showDone?: boolean
    uploadingColor?: string
    processingColor?: string
    uploadingProgress?: number | null
    hideIcon?: boolean
  }>(),
  {
    assetType: AssetType.Image,
    assetStatus: AssetStatus.WithFile,
    src: undefined,
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
    showDone: false,
    uploadingColor: 'primary',
    processingColor: 'primary',
    uploadingProgress: null,
    hideIcon: false,
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
  return props.assetStatus === AssetStatus.WithFile ? '#505050' : '#8f8f8f'
})

const srcComputed = computed(() => {
  return isUndefined(props.src) ? placeholder16x9 : props.src
})

const showIconComputed = computed(() => {
  if (props.hideIcon) return false
  else if (props.assetType === AssetType.Image && props.src) return false
  return true
})

const showDoneComputed = computed(() => {
  return props.showDone
})

watch(showDoneComputed, (newValue) => {
  console.log(newValue)
})
</script>

<template>
  <VImg
    v-if="showUploading || showProcessing || showWaiting"
    :aspect-ratio="aspectRatio"
    :src="srcComputed"
    :width="width"
    :height="height"
    :cover="cover"
    @error="onError"
    @load="onLoad"
    class="asset-image asset-image--loading-bg"
  >
    <template v-slot:default>
      <div class="asset-image__progress" v-if="showWaiting">
        <VProgressCircular indeterminate :size="iconSize" :width="iconSize / 10" />
        <div class="text-caption text-center">{{ t('common.upload.waiting') }}</div>
      </div>
      <div class="asset-image__progress" v-if="showProcessing">
        <VProgressCircular
          :color="processingColor"
          indeterminate
          :size="iconSize"
          :width="iconSize / 10"
          class="ml-auto mr-auto"
        ></VProgressCircular>
        <div class="text-caption text-center">{{ t('common.upload.processing') }}</div>
      </div>
      <div class="asset-image__progress" v-else-if="showUploading">
        <VProgressCircular
          :color="uploadingColor"
          :size="iconSize"
          :width="iconSize / 10"
          class="ml-auto mr-auto"
          :model-value="uploadingProgress === null ? undefined : uploadingProgress"
        >
          {{ uploadingPercentage }}
        </VProgressCircular>
        <div class="text-caption text-center">{{ t('common.upload.uploading') }}</div>
      </div>
    </template>
  </VImg>
  <VImg
    v-else-if="assetStatus === AssetStatus.WithFile && src && useComponent"
    :src="srcComputed"
    @load="onLoad"
    @error="onError"
    :width="width"
    :height="height"
    class="asset-image asset-image--component position-relative"
    :cover="cover"
    :aspect-ratio="aspectRatio"
  >
    <template v-slot:default>
      <div class="asset-image__icon-wrapper" v-if="showIconComputed">
        <div class="asset-image__icon-circle" :style="{ padding: iconSize / 4 + 'px' }">
          <VIcon :size="iconSize" v-if="icon.length" :icon="icon" :color="iconColor" />
        </div>
      </div>
      <div class="asset-image__progress asset-image__progress--animate-done" v-if="showDone">
        <VIcon icon="mdi-check-circle" color="success" :size="iconSize" />
        <div class="text-caption text-center">{{ t('common.upload.done') }}</div>
      </div>
    </template>
  </VImg>
  <div class="asset-image asset-image--img position-relative" v-else-if="assetStatus === AssetStatus.WithFile && src">
    <img
      :src="srcComputed"
      :width="width"
      :height="height"
      alt=""
      :style="'background-color:' + backgroundColorComputed"
    />
    <div class="asset-image__icon-wrapper" v-if="showIconComputed">
      <div class="asset-image__icon-circle" :style="{ padding: iconSize / 4 + 'px' }">
        <VIcon :size="iconSize" v-if="icon.length" :icon="icon" :color="iconColor" class="asset-image__icon" />
      </div>
    </div>
  </div>
  <div
    v-else
    :style="{ height: fallbackHeight + 'px', backgroundColor: backgroundColorComputed }"
    style="width: 100%"
    class="asset-image asset-image--placeholder d-flex align-center justify-center"
  >
    <div class="asset-image__icon-wrapper" v-if="showIconComputed">
      <div class="asset-image__icon-circle" :style="{ padding: iconSize / 4 + 'px' }">
        <VIcon :size="iconSize" v-if="icon.length" :icon="icon" :color="iconColor" class="asset-image__icon" />
      </div>
    </div>
    <div class="asset-image__progress asset-image__progress--animate-done" v-if="showDone">
      <VIcon icon="mdi-check-circle" color="success" :size="iconSize" />
      <div class="text-caption text-center">{{ t('common.upload.done') }}</div>
    </div>
  </div>
</template>
