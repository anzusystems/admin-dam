<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { GridView, useGridView } from '@/domains/system/composables/gridView'

const { t } = useI18n()

const { gridView, setGridView } = useGridView()
</script>

<template>
  <div>
    <VBtn
      :aria-label="t('coreDam.asset.list.gridView.masonry')"
      :aria-pressed="gridView === GridView.Masonry"
      size="x-small"
      icon
      variant="text"
      @click.stop="setGridView(GridView.Masonry)"
    >
      <VIcon icon="mdi-view-compact" />
      <VTooltip
        activator="parent"
        location="bottom"
      >
        {{ t('coreDam.asset.list.gridView.masonry') }}
      </VTooltip>
    </VBtn>
    <VBtn
      :aria-label="t('coreDam.asset.list.gridView.thumbnail')"
      :aria-pressed="gridView === GridView.Thumbnail"
      icon
      size="x-small"
      variant="text"
      @click.stop="setGridView(GridView.Thumbnail)"
    >
      <VIcon icon="mdi-view-grid" />
      <VTooltip
        activator="parent"
        location="bottom"
      >
        {{ t('coreDam.asset.list.gridView.thumbnail') }}
      </VTooltip>
    </VBtn>
    <VBtn
      :aria-label="t('coreDam.asset.list.gridView.table')"
      :aria-pressed="gridView === GridView.Table"
      size="x-small"
      icon
      variant="text"
      @click.stop="setGridView(GridView.Table)"
    >
      <VIcon icon="mdi-view-headline" />
      <VTooltip
        activator="parent"
        location="bottom"
      >
        {{ t('coreDam.asset.list.gridView.table') }}
      </VTooltip>
    </VBtn>
  </div>
</template>
