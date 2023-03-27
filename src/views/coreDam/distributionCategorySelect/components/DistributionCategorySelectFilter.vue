<script lang="ts" setup>
import { useAssetType } from '@/model/coreDam/valueObject/AssetType'
import { useDistributionCategorySelectListFilter } from '@/model/coreDam/filter/DistributionCategorySelectFilter'
import {
  AFilterInteger,
  AFilterString,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
} from '@anzusystems/common-admin'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useDistributionCategorySelectListFilter()
const touched = ref(false)

const submitFilter = () => {
  touched.value = false
  emit('submitFilter')
}

const resetFilter = () => {
  touched.value = false
  emit('resetFilter')
}

const { assetTypeOptions } = useAssetType()

const onAnyFilterUpdate = () => {
  touched.value = true
}
</script>

<template>
  <VForm
    name="search"
    @submit.prevent="submitFilter"
  >
    <AFilterWrapper
      :touched="touched"
      @reset-filter="resetFilter"
    >
      <VRow align="start">
        <VCol cols="12">
          <AFilterValueObjectOptionsSelect
            v-model="filter.type"
            :items="assetTypeOptions"
            @change="submitFilter"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="1">
          <AFilterInteger
            v-model="filter.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="2">
          <AFilterString
            v-model="filter.serviceSlug"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
