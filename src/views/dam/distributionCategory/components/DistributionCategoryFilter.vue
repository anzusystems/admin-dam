<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterInteger from '@/components/filter/AFilterInteger.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import { useDistributionCategoryFilter } from '@/model/dam/filter/DistributionCategoryFilter'
import AFilterValueObject from '@/components/filter/AFilterValueObject.vue'
import { useAssetType } from '@/model/dam/valueObject/AssetType'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useDistributionCategoryFilter()

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
    <FilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="12">
          <AFilterValueObject v-model="filter.type" :items="assetTypeOptions"></AFilterValueObject>
        </VCol>
        <VCol cols="1">
          <AFilterInteger v-model="filter.id"></AFilterInteger>
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.name"></AFilterString>
        </VCol>
      </VRow>
    </FilterWrapper>
  </VForm>
</template>
