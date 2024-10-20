<script lang="ts" setup>
import { AChipNoLink, type DamAuthorTypeType, useDamAuthorType } from '@anzusystems/common-admin'
import { computed } from 'vue'

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
