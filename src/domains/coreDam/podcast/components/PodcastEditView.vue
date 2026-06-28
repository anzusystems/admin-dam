<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { usePodcastEditActions } from '@/domains/coreDam/podcast/composables/podcastActions'
import PodcastEditForm from '@/domains/coreDam/podcast/components/PodcastEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const { saveButtonLoading, saveAndCloseButtonLoading, detailLoading, fetchData, resetStore, onUpdate, podcast } =
  usePodcastEditActions()

const editForm = ref<InstanceType<typeof PodcastEditForm> | null>(null)

const onSave = () => {
  onUpdate(false, async () => {
    // Re-baseline the export-data editor against the saved response so its rows lose the unsaved markers.
    await nextTick()
    editForm.value?.commit()
  })
}

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
    { title: t('breadcrumb.coreDam.podcast.list'), routeName: '/(coreDam)/podcasts' },
    {
      title: podcast.value.texts.title || t('breadcrumb.coreDam.podcast.edit'),
      routeName: '/(coreDam)/podcasts/[id]/edit',
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
        @save-record="onSave"
      />
      <AActionCloseButton :route-name="'/(coreDam)/podcasts'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PodcastEditForm
        v-if="!detailLoading"
        ref="editForm"
      />
    </VCardText>
  </ACard>
</template>
