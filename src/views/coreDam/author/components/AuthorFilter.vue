<script lang="ts" setup>
import { useAuthorListFilter } from '@/model/coreDam/filter/AuthorFilter'
import { useAuthorType } from '@/model/coreDam/valueObject/AuthorType'
import { useI18n } from 'vue-i18n'
import {
  AFilterBooleanGroup,
  AFilterString,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
} from '@anzusystems/common-admin'

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

const { t } = useI18n()

const { authorTypeOptions } = useAuthorType()
</script>

<template>
  <VForm name="search" @submit.prevent="submitFilter">
    <AFilterWrapper @reset-filter="resetFilter">
      <VRow align="start">
        <VCol cols="2">
          <AFilterString v-model="filter.id" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.text" />
        </VCol>
        <VCol cols="2">
          <AFilterString v-model="filter.identifier" />
        </VCol>
        <VCol cols="3">
          <AFilterValueObjectOptionsSelect v-model="filter.type" :items="authorTypeOptions" />
        </VCol>
        <VCol cols="2">
          <AFilterBooleanGroup v-model="filter.reviewed" :label="t('coreDam.author.filter.reviewed')" />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
