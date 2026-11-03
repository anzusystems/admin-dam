<script lang="ts" setup>
import { ACopyText, type AssetFile, assetFileIsImageFile } from '@anzusystems/common-admin'

const props = defineProps<{
  file: AssetFile
}>()

type ExifData = Record<string, string | number | boolean | null>

interface ExifEntry {
  key: string
  label: string
  value: string
}

const { t } = useI18n()

const exifData = computed<ExifData | undefined>(() => {
  if (!assetFileIsImageFile(props.file)) return undefined
  // common-admin types exifData as an empty array, DAM sends an object
  return props.file.metadata?.exifData as unknown as ExifData | undefined
})

const entries = computed<ExifEntry[]>(() => {
  if (!exifData.value) return []
  return Object.entries(exifData.value)
    .map(([key, value]) => ({
      key,
      label: key.replace(/([a-z0-9])([A-Z])/g, '$1 $2'),
      value: value === null ? '' : String(value),
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
})
</script>

<template>
  <VExpansionPanel
    v-if="entries.length > 0"
    elevation="0"
    :title="t('coreDam.asset.detail.exif.title', { count: entries.length })"
    value="exif"
    data-cy="asset-exif-panel"
  >
    <VExpansionPanelText class="text-body-small">
      <VRow
        v-for="entry in entries"
        :key="entry.key"
      >
        <VCol
          cols="3"
          class="text-break"
        >
          {{ entry.label }}
        </VCol>
        <VCol cols="9">
          <ACopyText :value="entry.value" />
        </VCol>
      </VRow>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>
