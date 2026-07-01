<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'
import {
  type AuthorCleanPhraseModeType,
  useAuthorCleanPhraseModeTypes,
} from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseMode'

const props = withDefaults(
  defineProps<{
    status: AuthorCleanPhraseModeType
  }>(),
  {}
)

const { getAuthorCleanPhraseModeOption } = useAuthorCleanPhraseModeTypes()
const statusOption = computed(() => {
  return getAuthorCleanPhraseModeOption(props.status)
})
</script>

<template>
  <AChipNoLink v-if="statusOption">
    {{ statusOption.title }}
  </AChipNoLink>
</template>
