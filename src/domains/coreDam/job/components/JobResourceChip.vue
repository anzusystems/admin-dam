<script lang="ts" setup>
import { type JobResource, useJobResource } from '@/domains/coreDam/job/valueObject/JobResource'
import { AChipNoLink } from '@anzusystems/common-admin'

const props = defineProps<{
  value: JobResource
}>()

const { getJobResourceOption } = useJobResource()
const option = computed(() => getJobResourceOption(props.value))
</script>

<template>
  <AChipNoLink>{{ option.title }}</AChipNoLink>
</template>
