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

const panels = ref<string[]>([])

const entries = computed<ExifEntry[]>(() => {
  if (!props.exifData) return []
  return Object.entries(props.exifData)
    .map(([key, value]) => ({ key, value: value === null ? '' : String(value) }))
    .sort((a, b) => a.key.localeCompare(b.key))
})
</script>

<template>
  <VExpansionPanels
    v-if="entries.length > 0"
    v-model="panels"
    multiple
    class="v-expansion-panels--compact"
  >
    <VExpansionPanel
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
          <VCol cols="3">
            {{ entry.key }}
          </VCol>
          <VCol cols="9">
            <ACopyText :value="entry.value" />
          </VCol>
        </VRow>
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>
</template>
