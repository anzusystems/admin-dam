<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import PodcastCreateButton from '@/views/dam/podcast/components/PodcastCreateButton.vue'
import PodcastDatatable from '@/views/dam/podcast/components/PodcastDatatable.vue'
import { ref } from 'vue'
import { usePodcastListActions } from '@/views/dam/podcast/composables/podcastActions'
import { ACL } from '@/types/Permission'

const { t } = useI18n()
const { listLoading } = usePodcastListActions()

const datatable = ref<InstanceType<typeof PodcastDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.podcast.meta.list')" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_PODCAST_CREATE">
      <PodcastCreateButton data-cy="button-create" disable-redirect @after-create="afterCreate" />
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard :loading="listLoading">
    <PodcastDatatable ref="datatable" />
  </ACard>
</template>
