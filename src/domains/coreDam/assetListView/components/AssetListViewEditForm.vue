<script lang="ts" setup>
import { ASystemEntityScope } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/assetListView/api/assetListViewApi'
import AssetListViewFormFields from '@/domains/coreDam/assetListView/components/AssetListViewFormFields.vue'
import { useAssetListViewEditActions } from '@/domains/coreDam/assetListView/composables/assetListViewActions'
import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

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
        <DamTrackingFields :data="assetListView" />
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
