<script lang="ts" setup>
import { computed } from 'vue'
import { JobResource, useJobResource } from '@/model/dam/valueObject/JobResource'

const props = defineProps<{
  value: JobResource
}>()

const { getJobResourceOption } = useJobResource()
const option = computed(() => getJobResourceOption(props.value))
</script>

<template>
  <VChip label size="small">{{ option.title }}</VChip>
</template>
