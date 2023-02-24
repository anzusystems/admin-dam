<script lang="ts" setup>
import { useAssetType } from '@/model/dam/valueObject/AssetType'
import { useDistributionCategorySelectListFilter } from '@/model/dam/filter/DistributionCategorySelectFilter'
import {
  AFilterInteger,
  AFilterString,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
} from '@anzusystems/common-admin'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useDistributionCategorySelectListFilter()

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
          <AFilterValueObjectOptionsSelect v-model="filter.type" :items="assetTypeOptions" @change="submitFilter" />
        </VCol>
        <VCol cols="1">
          <AFilterInteger v-model="filter.id" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.serviceSlug" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
