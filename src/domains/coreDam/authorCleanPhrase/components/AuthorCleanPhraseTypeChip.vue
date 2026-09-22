<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'
import {
  type AuthorCleanPhraseTypeType,
  useAuthorCleanPhraseTypeTypes,
} from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseType'

const props = withDefaults(
  defineProps<{
    type: AuthorCleanPhraseTypeType
  }>(),
  {}
)

const { getAuthorCleanPhraseTypeOption } = useAuthorCleanPhraseTypeTypes()
const statusOption = computed(() => {
  return getAuthorCleanPhraseTypeOption(props.type)
})
</script>

<template>
  <AChipNoLink v-if="statusOption">
    {{ statusOption.title }}
  </AChipNoLink>
</template>
