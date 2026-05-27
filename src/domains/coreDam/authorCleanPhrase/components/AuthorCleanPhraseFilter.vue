<script lang="ts" setup>
import { useAuthorCleanPhraseListFilter } from '@/domains/coreDam/authorCleanPhrase/filter/AuthorCleanPhraseFilter'
import { AFilterString, AFilterValueObjectOptionsSelect, AFilterWrapper } from '@anzusystems/common-admin'
import { useAuthorCleanPhraseTypeTypes } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseType'
import { useAuthorCleanPhraseModeTypes } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseMode'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useAuthorCleanPhraseListFilter()
const touched = ref(false)

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

const { authorCleanPhraseTypeOptions } = useAuthorCleanPhraseTypeTypes()
const { authorCleanPhraseModeOptions } = useAuthorCleanPhraseModeTypes()
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
      <VRow class="align-start">
        <VCol cols="3">
          <AFilterString
            v-model="filter.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="3">
          <AFilterString
            v-model="filter.phrase"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="3">
          <AFilterValueObjectOptionsSelect
            v-model="filter.type"
            :items="authorCleanPhraseTypeOptions"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol cols="3">
          <AFilterValueObjectOptionsSelect
            v-model="filter.mode"
            :items="authorCleanPhraseModeOptions"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
    </AFilterWrapper>
  </VForm>
</template>
