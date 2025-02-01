<script lang="ts" setup>
import type {
  CustomDistributionUpdateDto,
} from '@/types/coreDam/Distribution.ts'

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
