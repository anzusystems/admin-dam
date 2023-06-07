<script lang="ts" setup>
import AssetTableListItem from '@/views/coreDam/asset/list/components/AssetTableRowItem.vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import { useAssetListActions } from '@/views/coreDam/asset/list/composables/assetListActions'
import { useI18n } from 'vue-i18n'

const { sidebarRight } = useMainWrapper()

const { t } = useI18n()

const { items, showDetail, onItemClick, toggleSelected, selectMultiple } = useAssetListActions(sidebarRight)
</script>

<template>
  <VTable
    class="a-table"
    fixed-header
  >
    <thead>
      <tr>
        <th />
        <th class="text-left">
          {{ t('coreDam.asset.list.table.thead.thumbnail') }}
        </th>
        <th class="text-left">
          {{ t('coreDam.asset.list.table.thead.title') }}
        </th>
        <th class="text-left">
          {{ t('coreDam.asset.list.table.thead.createdDate') }}
        </th>
        <th class="text-left">
          {{ t('coreDam.asset.list.table.thead.advanced') }}
        </th>
        <th class="text-left">
          {{ t('coreDam.asset.list.table.thead.format') }}
        </th>
        <th class="text-left">
          {{ t('coreDam.asset.list.table.thead.size') }}
        </th>
        <th class="text-left">
          {{ t('coreDam.asset.list.table.thead.createdBy') }}
        </th>
        <th class="text-left">
          {{ t('coreDam.asset.list.table.thead.slot') }}
        </th>
        <th />
      </tr>
    </thead>
    <tbody>
      <AssetTableListItem
        v-for="(item, index) in items"
        :key="item.asset.id"
        :index="index"
        :item="item"
        @show-detail="showDetail"
        @item-click="onItemClick"
        @toggle-selected="toggleSelected"
        @select-multiple="selectMultiple"
      />
    </tbody>
  </VTable>
</template>
