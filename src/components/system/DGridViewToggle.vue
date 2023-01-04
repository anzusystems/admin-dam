<script setup lang="ts">
import { GridView, useGridView } from '@/composables/system/gridView'

const { setGridView } = useGridView()
</script>

<template>
  <div>
    <VBtn @click.stop="setGridView(GridView.Masonry)" size="x-small" icon variant="text">
      <VIcon icon="mdi-view-compact" />
      <VTooltip activator="parent" location="bottom">Masonry</VTooltip>
    </VBtn>
    <VBtn @click.stop="setGridView(GridView.Thumbnail)" icon size="x-small" variant="text">
      <VIcon icon="mdi-view-grid" />
      <VTooltip activator="parent" location="bottom">Grid</VTooltip>
    </VBtn>
  </div>
</template>
