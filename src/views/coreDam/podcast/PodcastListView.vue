<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import PodcastCreateButton from '@/views/coreDam/podcast/components/PodcastCreateButton.vue'
import PodcastDatatable from '@/views/coreDam/podcast/components/PodcastDatatable.vue'
import { ref } from 'vue'
import { usePodcastListActions } from '@/views/coreDam/podcast/composables/podcastActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { listLoading } = usePodcastListActions()

const datatable = ref<InstanceType<typeof PodcastDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_PODCAST_CREATE">
        <PodcastCreateButton
          data-cy="button-create"
          @on-success="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <PodcastDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
