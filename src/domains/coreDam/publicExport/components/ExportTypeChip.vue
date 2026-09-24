<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'
import { computed } from 'vue'

import { useExportTypeTypes } from '@/domains/coreDam/asset/valueObject/ExportType'
import type { ExportTypeType } from '@/domains/coreDam/asset/valueObject/ExportType'

const props = withDefaults(
  defineProps<{
    type: ExportTypeType
  }>(),
  {}
)

const { getExportTypeOption } = useExportTypeTypes()
const typeOption = computed(() => {
  return getExportTypeOption(props.type)
})
</script>

<template>
  <AChipNoLink v-if="typeOption">
    {{ typeOption.title }}
  </AChipNoLink>
</template>
