<script lang="ts" setup>
import { ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import VideoShowCreateButton from '@/views/coreDam/videoShow/components/VideoShowCreateButton.vue'
import VideoShowDatatable from '@/views/coreDam/videoShow/components/VideoShowDatatable.vue'
import { computed, ref } from 'vue'
import { useVideoShowListActions } from '@/views/coreDam/videoShow/composables/videoShowActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { listLoading } = useVideoShowListActions()

const datatable = ref<InstanceType<typeof VideoShowDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.videoShow.list'), routeName: '/(coreDam)/video-show' },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
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
