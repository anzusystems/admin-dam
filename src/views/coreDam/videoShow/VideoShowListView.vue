<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import VideoShowCreateButton from '@/views/coreDam/videoShow/components/VideoShowCreateButton.vue'
import VideoShowDatatable from '@/views/coreDam/videoShow/components/VideoShowDatatable.vue'
import { ref } from 'vue'
import { useVideoShowListActions } from '@/views/coreDam/videoShow/composables/videoShowActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { listLoading } = useVideoShowListActions()

const datatable = ref<InstanceType<typeof VideoShowDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_VIDEO_SHOW_CREATE">
        <VideoShowCreateButton
          data-cy="button-create"
          disable-redirect
          @on-success="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <VideoShowDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
