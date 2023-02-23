<script lang="ts" setup>
import { useAssetLicenceListFilter } from '@/model/dam/filter/AssetLicenceFilter'
import { AFilterWrapper, AFilterInteger, AFilterString } from '@anzusystems/common-admin'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filterAssetLicence = useAssetLicenceListFilter()

const submitFilter = () => {
  emit('submitFilter')
}

const resetFilter = () => {
  emit('resetFilter')
}
</script>

<template>
  <VForm name="search" @submit.prevent="submitFilter">
    <AFilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="1">
          <AFilterInteger v-model="filterAssetLicence.id" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filterAssetLicence.extId" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
