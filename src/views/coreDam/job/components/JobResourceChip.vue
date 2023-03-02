<script lang="ts" setup>
import { computed } from 'vue'
import { type JobResource, useJobResource } from '@/model/coreDam/valueObject/JobResource'

const props = defineProps<{
  value: JobResource
}>()

const { getJobResourceOption } = useJobResource()
const option = computed(() => getJobResourceOption(props.value))
</script>

<template>
  <VChip label size="small">{{ option.title }}</VChip>
</template>
