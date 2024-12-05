<script lang="ts" setup>
import { useRoute } from 'vue-router'
import {
  AActionCloseButton,
  ACard,
  AJobDetailCommon,
  isUndefined,
  JOB_RESOURCE_USER_DATA_DELETE,
  stringToInt,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { useJobDetailActions } from '@/views/coreDam/job/composables/jobActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import JobDetailPodcastSynchronizer from '@/views/coreDam/job/components/JobDetailPodcastSynchronizer.vue'
import JobDetailUserDataDelete from '@/views/coreDam/job/components/JobDetailUserDataDelete.vue'
import {
  JOB_AUTHOR_CURRENT_OPTIMIZE,
  JOB_RESOURCE_IMAGE_COPY,
  JOB_RESOURCE_PODCAST_SYNCHRONIZER
} from '@/model/coreDam/valueObject/JobResource'
import JobAuthorCurrentOptimize from '@/views/coreDam/job/components/JobAuthorCurrentOptimize.vue'
import JobImageCopy from '@/views/coreDam/job/components/JobImageCopy.vue'

const { detailLoading, fetchData, resetStore, job } = useJobDetailActions()

const route = useRoute()
const id = stringToInt(route.params.id)

const getDetail = () => {
  fetchData(id)
}

const jobComponent = computed(() => {
  if (isUndefined(job.value)) return AJobDetailCommon
  switch (job.value._resourceName) {
    case JOB_RESOURCE_PODCAST_SYNCHRONIZER:
      return JobDetailPodcastSynchronizer
    case JOB_AUTHOR_CURRENT_OPTIMIZE:
      return JobAuthorCurrentOptimize
    case JOB_RESOURCE_IMAGE_COPY:
      return JobImageCopy
    case JOB_RESOURCE_USER_DATA_DELETE:
      return JobDetailUserDataDelete
    default:
      return AJobDetailCommon
  }
})

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <AActionCloseButton :route-name="ROUTE.DAM.JOB.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <component
        :is="jobComponent"
        v-if="job"
        :job="job"
        :loading="detailLoading"
      />
    </VCardText>
  </ACard>
</template>
