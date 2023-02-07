<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterInteger from '@/components/filter/AFilterInteger.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import AFilterValueObject from '@/components/filter/AFilterValueObject.vue'
import { useAssetType } from '@/model/dam/valueObject/AssetType'
import { useDistributionCategorySelectListFilter } from '@/model/dam/filter/DistributionCategorySelectFilter'

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
    <FilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="12">
          <AFilterValueObject
            @change="submitFilter"
            v-model="filter.type"
            :items="assetTypeOptions"
          />
        </VCol>
        <VCol cols="1">
          <AFilterInteger v-model="filter.id"/>
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.serviceSlug"/>
        </VCol>
      </VRow>
    </FilterWrapper>
  </VForm>
</template>
