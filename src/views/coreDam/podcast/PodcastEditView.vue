<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePodcastEditActions } from '@/views/coreDam/podcast/composables/podcastActions'
import PodcastEditForm from '@/views/coreDam/podcast/components/PodcastEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const { saveButtonLoading, saveAndCloseButtonLoading, detailLoading, fetchData, resetStore, onUpdate, podcast } =
  usePodcastEditActions()

const getData = () => {
  fetchData(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.podcast.list'), routeName: '/(coreDam)/podcast' },
    {
      title: podcast.value.texts.title || t('breadcrumb.coreDam.podcast.edit'),
      routeName: '/(coreDam)/podcast/[id]/edit',
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
      <AActionCloseButton :route-name="'/(coreDam)/podcast'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PodcastEditForm />
    </VCardText>
  </ACard>
</template>
