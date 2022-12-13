<script setup lang="ts">
import { GridView, useGridView } from '@/composables/system/gridView'

const { setGridView } = useGridView()
</script>

<template>
  <div>
    <VBtn @click.stop="setGridView(GridView.Masonry)" icon="mdi-view-compact" size="x-small" variant="text"></VBtn>
    <VBtn @click.stop="setGridView(GridView.Thumbnail)" icon="mdi-view-grid" size="x-small" variant="text"></VBtn>
  </div>
</template>
