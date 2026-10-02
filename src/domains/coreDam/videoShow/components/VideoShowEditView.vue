<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  defineBreadcrumbs,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import VideoShowEditForm from '@/domains/coreDam/videoShow/components/VideoShowEditForm.vue'
import { useVideoShowEditActions } from '@/domains/coreDam/videoShow/composables/videoShowActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const { saveButtonLoading, saveAndCloseButtonLoading, detailLoading, fetchData, resetStore, onUpdate, videoShow } =
  useVideoShowEditActions()

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/video-shows',
  skipRouteNames: [
    '/(coreDam)/video-shows/[id]',
    '/(coreDam)/video-shows/[id]/episodes/[episodeId]',
    '/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit',
  ],
  loading: detailLoading,
})

onMounted(async () => {
  if ((await fetchData(id, { signal })) === false) await leave()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.videoShow.list'), routeName: '/(coreDam)/video-shows' },
    {
      title: videoShow.value.texts.title || t('breadcrumb.coreDam.videoShow.edit'),
      routeName: '/(coreDam)/video-shows/[id]/edit',
      routeParams: { id },
    },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/video-shows'"
        :skip-route-names="[
          '/(coreDam)/video-shows/[id]',
          '/(coreDam)/video-shows/[id]/episodes/[episodeId]',
          '/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit',
        ]"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VideoShowEditForm />
    </VCardText>
  </ACard>
</template>
