<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { useBetaTestFeatures } from '@/services/BetaTestFeaturesService'

const { maxUploadItems, maxAssetListItems, maxSelectedItems } = useBetaTestFeatures()
</script>

<template>
  <ActionbarWrapper />
  <VRow>
    <VCol cols="12">
      <ACard>
        <VRow
          align="center"
          class="pb-2"
        >
          <VCol cols="4">
            Max upload items count
          </VCol>
          <VCol>
            <VTextField
              v-model="maxUploadItems"
              type="number"
            />
          </VCol>
        </VRow>
        <VRow
          align="center"
          class="pb-2"
        >
          <VCol cols="4">
            Max asset list items count
          </VCol>
          <VCol>
            <VTextField
              v-model="maxAssetListItems"
              type="number"
            />
          </VCol>
        </VRow>
        <VRow
          align="center"
          class="pb-2"
        >
          <VCol cols="4">
            Max selected items count
          </VCol>
          <VCol>
            <VTextField
              v-model="maxSelectedItems"
              type="number"
            />
          </VCol>
        </VRow>
      </ACard>
    </VCol>
  </VRow>
</template>
