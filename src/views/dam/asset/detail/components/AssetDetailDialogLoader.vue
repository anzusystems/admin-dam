<script setup lang="ts">
import { useAssetListStore } from '@/stores/dam/assetListStore'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { useTheme } from '@/composables/system/themeSettings'
import { computed } from 'vue'
import { useAssetListActions } from '@/views/dam/asset/list/composables/assetListActions'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const emit = defineEmits<{
  (e: 'closeDialog'): void
}>()

const { toolbarColor } = useTheme()

const closeDialog = () => {
  emit('closeDialog')
}

const assetListStore = useAssetListStore()
const assetDetailStore = useAssetDetailStore()
const { pagination } = useAssetListActions() // todo

const totalCountText = computed(() => {
  if (!assetListStore.activeItemIndex) return ''
  return assetListStore.activeItemIndex + 1 + ' / ' + assetListStore.list.length + (pagination.hasNextPage ? '+' : '')
})
</script>

<template>
  <VCard class="dam-image-detail">
    <div class="d-flex flex-column w-100 h-100">
      <VToolbar :color="toolbarColor" density="compact" :height="64" class="system-border-b">
        <div v-if="assetDetailStore.view === 'list'">
          <VBtn variant="text" icon @click.stop="" class="mx-1" :width="36" :height="36">
            <VIcon icon="mdi-chevron-left" />
            <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.prev') }}</VTooltip>
          </VBtn>
          <VBtn variant="text" icon @click.stop="" class="mr-2" :width="36" :height="36">
            <VIcon icon="mdi-chevron-right" />
            <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.next') }}</VTooltip>
          </VBtn>
        </div>
        <div v-if="assetDetailStore.view === 'list'" class="text-subtitle-2 d-flex">
          <div class="pr-4">{{ totalCountText }}</div>
        </div>
        <VSpacer />
        <div>
          <VBtn icon variant="text" @click.stop="closeDialog" :width="36" :height="36" class="mr-1">
            <VIcon icon="mdi-close"></VIcon>
          </VBtn>
        </div>
      </VToolbar>
      <div class="d-flex w-100 h-100 justify-center align-center">
        <VProgressCircular indeterminate color="primary"></VProgressCircular>
      </div>
    </div>
  </VCard>
</template>
