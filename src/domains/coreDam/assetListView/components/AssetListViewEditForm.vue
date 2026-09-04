<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/assetListView/api/assetListViewApi'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import { useAssetListViewEditActions } from '@/domains/coreDam/assetListView/composables/assetListViewActions'
import AssetListViewFormFields from '@/domains/coreDam/assetListView/components/AssetListViewFormFields.vue'

const { assetListView } = useAssetListViewEditActions()
</script>

<template>
  <ASystemEntityScope
    :system="SYSTEM_CORE_DAM"
    :subject="ENTITY"
  >
    <VRow>
      <VCol
        cols="12"
        md="8"
      >
        <AssetListViewFormFields v-model="assetListView" />
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
