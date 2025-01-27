<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import {
  type AuthorCleanPhraseModeType,
  useAuthorCleanPhraseModeTypes,
} from '@/model/coreDam/valueObject/AuthorCleanPhraseMode'

const props = withDefaults(
  defineProps<{
    mode: AuthorCleanPhraseModeType
  }>(),
  {}
)

const { getAuthorCleanPhraseModeOption } = useAuthorCleanPhraseModeTypes()
const statusOption = computed(() => {
  return getAuthorCleanPhraseModeOption(props.mode)
})
</script>

<template>
  <AChipNoLink v-if="statusOption">
    {{ statusOption.title }}
  </AChipNoLink>
</template>
