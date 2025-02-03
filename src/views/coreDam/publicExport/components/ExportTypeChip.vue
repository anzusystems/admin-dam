<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import { type ExportTypeType, useExportTypeTypes } from '@/model/coreDam/valueObject/ExportType'

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
