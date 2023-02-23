<script lang="ts" setup>
import { useDistributionCategoryListFilter } from '@/model/dam/filter/DistributionCategoryFilter'
import { useAssetType } from '@/model/dam/valueObject/AssetType'
import {
  AFilterWrapper,
  AFilterInteger,
  AFilterString,
  AFilterValueObjectOptionsSelect,
} from '@anzusystems/common-admin'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useDistributionCategoryListFilter()

const submitFilter = () => {
  emit('submitFilter')
}

const resetFilter = () => {
  emit('resetFilter')
}

const { assetTypeOptions } = useAssetType()
</script>

<template>
  <VForm name="search" @submit.prevent="submitFilter">
    <AFilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="12">
          <AFilterValueObjectOptionsSelect v-model="filter.type" :items="assetTypeOptions" />
        </VCol>
        <VCol cols="1">
          <AFilterInteger v-model="filter.id" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.name" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
