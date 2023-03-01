<script lang="ts" setup>
import type { DistributionImagePreviewDto } from '@/types/coreDam/DistributionImagePreviewDto'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import { useI18n } from 'vue-i18n'
import { computed, onMounted } from 'vue'
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import { damConfig } from '@/services/DamConfigService'

const IMAGE_HEIGHT = 200
const IMAGE_BG_COLOR = '#ccc'

const props = withDefaults(
  defineProps<{
    item: DistributionImagePreviewDto
    index: number
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'toggleSelected', index: number): void
  (e: 'invalidImage', index: number): void
}>()

const { t } = useI18n()

const toggleSelected = () => {
  emit('toggleSelected', props.index)
}

const onImageError = () => {
  emit('invalidImage', props.index)
}

const title = computed(() => {
  if (damConfig.distributionServices[props.item.service]) {
    return damConfig.distributionServices[props.item.service].title
  }
  return props.item.id
})

onMounted(async () => {
  const img = new Image()
  img.onerror = () => {
    onImageError()
  }
  img.src = props.item.url
})
</script>

<template>
  <div
    class="dam-image-grid__item"
    :class="{ 'dam-image-grid__item--selected': item.selected }"
    @click.stop.exact="toggleSelected"
  >
    <div class="dam-image-grid__item-card">
      <div v-if="item.selected" class="selected-triangle">
        <div class="selected-triangle__bg" />
        <VIcon class="selected-triangle__icon" icon="mdi-check" color="white" size="x-small" />
      </div>
      <AssetImage
        :asset-status="item.url.length > 0 ? AssetStatus.WithFile : AssetStatus.Draft"
        :src="item.invalidImage ? '' : item.url"
        :background-color="IMAGE_BG_COLOR"
        :height="IMAGE_HEIGHT"
        :fallback-height="IMAGE_HEIGHT"
        use-component
        @error="onImageError"
      />
      <div class="dam-image-grid__item-text text-caption px-2 py-1">
        <div class="d-flex align-center justify-space-between position-relative">
          <div class="line-clamp-1">{{ title }}</div>
          <div class="dam-image-grid__item-card-actions">
            <VBtn
              variant="flat"
              class="detail-icon mr-1"
              color="secondary"
              :width="34"
              :height="34"
              icon
              @click.stop="toggleSelected"
            >
              <VIcon v-if="item.selected" icon="mdi-checkbox-outline" :size="20" />
              <VIcon v-else icon="mdi-checkbox-blank-outline" :size="20" />
              <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.toggleSelect') }}</VTooltip>
            </VBtn>
            <VBtn
              variant="flat"
              class="detail-icon mr-1"
              color="secondary"
              :width="34"
              :height="34"
              icon
              :href="item.url"
              target="_blank"
              @click.stop=""
            >
              <VIcon icon="mdi-open-in-new" :size="20" />
              <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.preview') }}</VTooltip>
            </VBtn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
