<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'
import { computed } from 'vue'

import { useAuthorCleanPhraseTypeTypes } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseType'
import type { AuthorCleanPhraseTypeType } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseType'

const props = withDefaults(
  defineProps<{
    type: AuthorCleanPhraseTypeType
  }>(),
  {}
)

const { getAuthorCleanPhraseTypeOption } = useAuthorCleanPhraseTypeTypes()
const statusOption = computed(() => getAuthorCleanPhraseTypeOption(props.type))
</script>

<template>
  <AChipNoLink v-if="statusOption">
    {{ statusOption.title }}
  </AChipNoLink>
</template>
