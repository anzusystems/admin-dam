<script setup lang="ts">
import { GridView, useGridView } from '@/composables/system/gridView'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const { setGridView } = useGridView()
</script>

<template>
  <div>
    <VBtn @click.stop="setGridView(GridView.Masonry)" size="x-small" icon variant="text">
      <VIcon icon="mdi-view-compact" />
      <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.gridView.masonry') }}</VTooltip>
    </VBtn>
    <VBtn @click.stop="setGridView(GridView.Thumbnail)" icon size="x-small" variant="text">
      <VIcon icon="mdi-view-grid" />
      <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.gridView.thumbnail') }}</VTooltip>
    </VBtn>
  </div>
</template>
