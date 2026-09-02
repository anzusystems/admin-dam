<script lang="ts" setup>
import type { ExifData } from '@/domains/coreDam/asset/types/AssetExif'
import { useClipboard } from '@vueuse/core'

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

const VALUE_TRUNCATE_LENGTH = 80

const { t } = useI18n()
const { copy, isSupported: clipboardCopyIsSupported } = useClipboard()
const { showSuccess } = useAlerts()

const filter = ref('')
const expandedKeys = ref<string[]>([])

const entries = computed<ExifEntry[]>(() => {
  if (!props.exifData) return []
  return Object.entries(props.exifData)
    .map(([key, value]) => ({ key, value: value === null ? '' : String(value) }))
    .sort((a, b) => a.key.localeCompare(b.key))
})

const filteredEntries = computed<ExifEntry[]>(() => {
  const needle = filter.value.trim().toLowerCase()
  if (needle.length === 0) return entries.value
  return entries.value.filter(
    (entry) => entry.key.toLowerCase().includes(needle) || entry.value.toLowerCase().includes(needle)
  )
})

const isExpanded = (key: string) => expandedKeys.value.includes(key)

const toggleExpanded = (key: string) => {
  expandedKeys.value = isExpanded(key)
    ? expandedKeys.value.filter((item) => item !== key)
    : [...expandedKeys.value, key]
}

const displayValue = (entry: ExifEntry) => {
  if (entry.value.length <= VALUE_TRUNCATE_LENGTH || isExpanded(entry.key)) return entry.value
  return `${entry.value.slice(0, VALUE_TRUNCATE_LENGTH)}…`
}

const copyValue = (value: string) => {
  copy(value).then(() => {
    showSuccess(t('coreDam.asset.detail.exif.valueCopied'))
  })
}
</script>

<template>
  <div
    class="px-4 text-body-small"
    data-cy="asset-exif-panel"
  >
    <div class="text-label-large py-2">
      {{ t('coreDam.asset.detail.exif.title', { count: entries.length }) }}
    </div>
    <div
      v-if="entries.length === 0"
      class="text-medium-emphasis py-2"
    >
      {{ t('coreDam.asset.detail.exif.empty') }}
    </div>
    <template v-else>
      <VTextField
        v-model="filter"
        :label="t('coreDam.asset.detail.exif.filter')"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        class="mb-2"
        data-cy="asset-exif-filter"
      />
      <div
        v-if="filteredEntries.length === 0"
        class="text-medium-emphasis py-2"
      >
        {{ t('coreDam.asset.detail.exif.noResults') }}
      </div>
      <VRow
        v-for="entry in filteredEntries"
        :key="entry.key"
        no-gutters
        class="align-start py-1 system-border-b"
      >
        <VCol
          cols="5"
          class="pr-2 text-medium-emphasis"
        >
          {{ entry.key }}
        </VCol>
        <VCol
          cols="6"
          class="asset-exif__value"
          @click="toggleExpanded(entry.key)"
        >
          {{ displayValue(entry) }}
        </VCol>
        <VCol
          cols="1"
          class="text-right"
        >
          <VBtn
            v-if="clipboardCopyIsSupported"
            icon="mdi-content-copy"
            variant="text"
            size="x-small"
            @click.stop="copyValue(entry.value)"
          />
        </VCol>
      </VRow>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.asset-exif {
  &__value {
    font-family: monospace;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
}
</style>
