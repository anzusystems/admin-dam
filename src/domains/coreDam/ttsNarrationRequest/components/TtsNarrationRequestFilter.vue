<script lang="ts" setup>
import {
  AFilterString,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  FilterConfigKey,
  FilterDataKey,
} from '@anzusystems/common-admin/labs'
import { useTtsNarrationRequestListActions } from '@/domains/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'
import { useTtsRequestStatus } from '@/domains/coreDam/ttsNarrationRequest/valueObject/TtsRequestStatus'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'reset'): void
}>()

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const { datatableHiddenColumns } = useTtsNarrationRequestListActions()

const { ttsRequestStatusOptions } = useTtsRequestStatus()
</script>

<template>
  <AFilterWrapper
    v-model:datatable-hidden-columns="datatableHiddenColumns"
    @submit="emit('submit')"
    @reset="emit('reset')"
  >
    <template #item.status>
      <AFilterValueObjectOptionsSelect
        name="status"
        :items="ttsRequestStatusOptions"
      />
    </template>
    <template #item.voiceFamilySlug>
      <AFilterString name="voiceFamilySlug" />
    </template>
  </AFilterWrapper>
</template>
