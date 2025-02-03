<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import {
  type AuthorCleanPhraseTypeType,
  useAuthorCleanPhraseTypeTypes,
} from '@/model/coreDam/valueObject/AuthorCleanPhraseType'

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
