<script lang="ts" setup>
import type { AssetFileImage } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  file: AssetFileImage
}>()

interface ExifEntry {
  key: string
  label: string
  value: string
}

const { t } = useI18n()

const entries = computed<ExifEntry[]>(() => {
  const exifData = props.file.metadata?.exifData
  if (!exifData) return []
  return Object.entries(exifData)
    .map(([key, value]) => ({
      key,
      label: key.replace(/([a-z0-9])([A-Z])/g, '$1 $2'),
      value: value === null ? '' : String(value),
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
})

const hasEntries = computed(() => entries.value.length > 0)
</script>

<template>
  <VExpansionPanel
    elevation="0"
    :readonly="!hasEntries"
    :hover="hasEntries"
    :class="{ 'text-disabled': !hasEntries }"
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
          {{ entry.value }}
        </VCol>
      </VRow>
    </VExpansionPanelText>
  </VExpansionPanel>
</template>
