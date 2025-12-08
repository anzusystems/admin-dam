<script lang="ts" setup>
import { computed } from 'vue'
import { AChipNoLink } from '@anzusystems/common-admin'
import { type DeviceTypeType, useDeviceTypeTypes } from '@/model/coreDam/valueObject/DeviceType'

const props = withDefaults(
  defineProps<{
    type: DeviceTypeType
  }>(),
  {}
)

const { getDeviceTypeOption } = useDeviceTypeTypes()
const typeOption = computed(() => {
  return getDeviceTypeOption(props.type)
})
</script>

<template>
  <AChipNoLink v-if="typeOption">
    {{ typeOption.title }}
  </AChipNoLink>
</template>
