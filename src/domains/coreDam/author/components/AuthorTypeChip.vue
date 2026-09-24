<script lang="ts" setup>
import { AChipNoLink, useDamAuthorType } from '@anzusystems/common-admin'
import type { DamAuthorTypeType } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    type: DamAuthorTypeType
  }>(),
  {}
)

const { getAuthorTypeOption } = useDamAuthorType()
const typeOption = computed(() => {
  return getAuthorTypeOption(props.type)
})
</script>

<template>
  <AChipNoLink v-if="typeOption">
    {{ typeOption.title }}
  </AChipNoLink>
</template>
