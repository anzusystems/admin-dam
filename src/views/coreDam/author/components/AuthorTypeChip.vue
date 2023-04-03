<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import { type AuthorType, useAuthorType } from '@/model/coreDam/valueObject/AuthorType'

const props = withDefaults(
  defineProps<{
    type: AuthorType
  }>(),
  {}
)

const { getAuthorTypeOption } = useAuthorType()
const typeOption = computed(() => {
  return getAuthorTypeOption(props.type)
})
</script>

<template>
  <AChipNoLink v-if="typeOption">
    {{ typeOption.title }}
  </AChipNoLink>
</template>
