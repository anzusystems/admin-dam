<script lang="ts" setup>
import { useRoute } from 'vue-router'
import {
  AActionCloseButton,
  ACard,
  AJobDetailCommon,
  defineBreadcrumbs,
  isUndefined,
  JOB_RESOURCE_USER_DATA_DELETE,
  stringToInt,
  useI18n,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useJobDetailActions } from '@/views/coreDam/job/composables/jobActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import JobDetailPodcastSynchronizer from '@/views/coreDam/job/components/JobDetailPodcastSynchronizer.vue'
import JobDetailUserDataDelete from '@/views/coreDam/job/components/JobDetailUserDataDelete.vue'
import {
  JOB_AUTHOR_CURRENT_OPTIMIZE,
  JOB_RESOURCE_IMAGE_COPY,
  JOB_RESOURCE_PODCAST_SYNCHRONIZER,
} from '@/model/coreDam/valueObject/JobResource'
import JobAuthorCurrentOptimize from '@/views/coreDam/job/components/JobAuthorCurrentOptimize.vue'
import JobImageCopy from '@/views/coreDam/job/components/JobImageCopy.vue'

const { detailLoading, fetchData, resetStore, job } = useJobDetailActions()

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

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

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.job.list'), routeName: '/(coreDam)/job' },
    {
      title: t('breadcrumb.coreDam.job.detail'),
      routeName: '/(coreDam)/job/[id]',
    },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionCloseButton :route-name="'/(coreDam)/job'" />
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
