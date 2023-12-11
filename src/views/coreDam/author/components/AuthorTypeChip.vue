<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import { type DamAuthorType, useDamAuthorType } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    type: DamAuthorType
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
