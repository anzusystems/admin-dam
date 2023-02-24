<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useBetaTestFeatures } from '@/services/BetaTestFeaturesService'

const { maxUploadItems, maxAssetListItems, maxSelectedItems } = useBetaTestFeatures()
</script>

<template>
  <ActionbarTitleWrapper heading="Beta" />
  <VRow>
    <VCol cols="12">
      <ACard>
        <VRow align="center" class="pb-2">
          <VCol cols="4">Max upload items count</VCol>
          <VCol><VTextField v-model="maxUploadItems" type="number" /></VCol>
        </VRow>
        <VRow align="center" class="pb-2">
          <VCol cols="4">Max asset list items count</VCol>
          <VCol><VTextField v-model="maxAssetListItems" type="number" /></VCol>
        </VRow>
        <VRow align="center" class="pb-2">
          <VCol cols="4">Max selected items count</VCol>
          <VCol><VTextField v-model="maxSelectedItems" type="number" /></VCol>
        </VRow>
        <!--        <VRow align="center" class="pb-2">-->
        <!--          <VCol><RouterLink :to="{ name: 'grid2' }">Recycle scroller grid</RouterLink></VCol>-->
        <!--        </VRow>-->
      </ACard>
    </VCol>
  </VRow>
</template>
