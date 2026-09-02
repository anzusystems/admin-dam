<script lang="ts" setup>
import type { ExifData } from '@/domains/coreDam/asset/types/AssetExif'
import { ACopyText } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    exifData?: ExifData | undefined
  }>(),
  {
    exifData: undefined,
  }
)

interface ExifEntry {
  key: string
  value: string
}

const { t } = useI18n()

const entries = computed<ExifEntry[]>(() => {
  if (!props.exifData) return []
  return Object.entries(props.exifData)
    .map(([key, value]) => ({ key, value: value === null ? '' : String(value) }))
    .sort((a, b) => a.key.localeCompare(b.key))
})
</script>

<template>
  <div
    class="pa-3 text-body-small"
    data-cy="asset-exif-panel"
  >
    <div class="text-label-large pb-3">
      {{ t('coreDam.asset.detail.exif.title', { count: entries.length }) }}
    </div>
    <div
      v-if="entries.length === 0"
      class="text-medium-emphasis"
    >
      {{ t('coreDam.asset.detail.exif.empty') }}
    </div>
    <VRow
      v-for="entry in entries"
      :key="entry.key"
    >
      <VCol cols="3">
        {{ entry.key }}
      </VCol>
      <VCol cols="9">
        <ACopyText :value="entry.value" />
      </VCol>
    </VRow>
  </div>
</template>
