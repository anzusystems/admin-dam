<script lang="ts" setup>
import { useAssetLicenceListFilter } from '@/model/coreDam/filter/AssetLicenceFilter'
import {
  AFilterInteger,
  AFilterString,
  AFilterWrapper,
} from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FilterExtSystemRemoteAutocomplete
  from '@/views/coreDam/extSystem/components/FilterExtSystemRemoteAutocomplete.vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filterAssetLicence = useAssetLicenceListFilter()
const touched = ref(false)
const { t } = useI18n()

const submitFilter = () => {
  touched.value = false
  emit('submitFilter')
}

const resetFilter = () => {
  touched.value = false
  emit('resetFilter')
}

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
        <VCol cols="1">
          <AFilterInteger
            v-model="filterAssetLicence.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="2">
          <AFilterString
            v-model="filterAssetLicence.extId"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="2">
          <FilterExtSystemRemoteAutocomplete
            v-model="filterAssetLicence.extSystem"
            :label="t('coreDam.extSystem.filter.extSystem')"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
