<script lang="ts" setup>
import type {
  CustomDistributionUpdateDto,
} from '@/types/coreDam/Distribution.ts'
import type { ValidationScope } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    readonly?: boolean,
    validationScope?: ValidationScope
  }>(),
  {
    readonly: false,
    validationScope: undefined,
  }
)

const distribution = defineModel<CustomDistributionUpdateDto>({ required: true })

</script>

<template>
</template>
