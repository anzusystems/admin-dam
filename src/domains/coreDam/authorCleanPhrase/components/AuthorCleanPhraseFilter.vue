<script lang="ts" setup>
import {
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { useAuthorCleanPhraseTypeTypes } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseType'
import { useAuthorCleanPhraseModeTypes } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseMode'
import { useAuthorCleanPhraseListActions } from '@/domains/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useAuthorCleanPhraseListActions()

const { authorCleanPhraseTypeOptions } = useAuthorCleanPhraseTypeTypes()
const { authorCleanPhraseModeOptions } = useAuthorCleanPhraseModeTypes()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #item.type>
      <AFilterValueObjectOptionsSelect
        name="type"
        :items="authorCleanPhraseTypeOptions"
      />
    </template>
    <template #item.mode>
      <AFilterValueObjectOptionsSelect
        name="mode"
        :items="authorCleanPhraseModeOptions"
      />
    </template>
  </AFilterWrapper>
</template>
