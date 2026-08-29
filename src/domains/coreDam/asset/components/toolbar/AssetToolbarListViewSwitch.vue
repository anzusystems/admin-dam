<script lang="ts" setup>
import { useCurrentListView } from '@/domains/coreDam/assetListView/composables/currentListView'
import { useAssetListActions } from '@/domains/coreDam/asset/components/list/composables/assetListActions'

const { availableListViews, currentListView } = useCurrentListView()
const { selectListView } = useAssetListActions()

const { t } = useI18n()
</script>

<template>
  <VBtn
    v-if="currentListView"
    variant="text"
    size="small"
    class="ml-1"
    data-cy="button-list-view-switch"
  >
    {{ currentListView.name }}
    <VIcon
      icon="mdi-menu-down"
      end
    />
    <VMenu activator="parent">
      <VList>
        <VListItem
          v-for="listView in availableListViews"
          :key="listView.id"
          :active="listView.id === currentListView.id"
          :title="listView.name"
          @click.stop="selectListView(listView.id)"
        />
      </VList>
    </VMenu>
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('coreDam.assetListView.meta.switch') }}
    </VTooltip>
  </VBtn>
</template>
