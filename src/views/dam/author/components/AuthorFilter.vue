<script lang="ts" setup>
import FilterWrapper from '@/components/wrappers/FilterWrapper.vue'
import AFilterString from '@/components/filter/AFilterString.vue'
import { useAuthorListFilter } from '@/model/dam/filter/AuthorFilter'
import AFilterValueObject from '@/components/filter/AFilterValueObject.vue'
import { useAuthorType } from '@/model/dam/valueObject/AuthorType'
import { useI18n } from 'vue-i18n'
import AFilterBooleanGroup from '@/components/filter/AFilterBooleanGroup.vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useAuthorListFilter()

const submitFilter = () => {
  emit('submitFilter')
}

const resetFilter = () => {
  emit('resetFilter')
}

const { t } = useI18n({ useScope: 'global' })

const { authorTypeOptions } = useAuthorType()
</script>

<template>
  <VForm name="search" @submit.prevent="submitFilter">
    <FilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="2">
          <AFilterString v-model="filter.id"></AFilterString>
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.text"></AFilterString>
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.identifier"></AFilterString>
        </VCol>
        <VCol cols="3">
          <AFilterValueObject v-model="filter.type" :items="authorTypeOptions"></AFilterValueObject>
        </VCol>
        <VCol cols="2">
          <AFilterBooleanGroup
            :label="t('coreDam.author.filter.reviewed')"
            v-model="filter.reviewed"
          ></AFilterBooleanGroup>
        </VCol>
      </VRow>
    </FilterWrapper>
  </VForm>
</template>
