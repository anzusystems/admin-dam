<script setup lang="ts">
import { GridView, useGridView } from '@/composables/system/gridView'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { setGridView } = useGridView()
</script>

<template>
  <div>
    <VBtn
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
