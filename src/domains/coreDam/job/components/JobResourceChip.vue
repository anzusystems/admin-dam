<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'

import { useJobResource } from '@/domains/coreDam/job/valueObject/JobResource'
import type { JobResource } from '@/domains/coreDam/job/valueObject/JobResource'

const props = defineProps<{
  value: JobResource
}>()

const { getJobResourceOption } = useJobResource()
const option = computed(() => getJobResourceOption(props.value))
</script>

<template>
  <AChipNoLink>{{ option?.title ?? value }}</AChipNoLink>
</template>
