<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import VideoShowCreateButton from '@/views/dam/videoShow/components/VideoShowCreateButton.vue'
import VideoShowDatatable from '@/views/dam/videoShow/components/VideoShowDatatable.vue'
import { ref } from 'vue'
import { useVideoShowListActions } from '@/views/dam/videoShow/composables/videoShowActions'
import { ACL } from '@/types/Permission'

const { t } = useI18n()
const { listLoading } = useVideoShowListActions()

const datatable = ref<InstanceType<typeof VideoShowDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.videoShow.meta.list')" icon="mdi-videoShow" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_VIDEO_SHOW_CREATE">
      <VideoShowCreateButton data-cy="button-create" disable-redirect @after-create="afterCreate" />
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard :loading="listLoading">
    <VideoShowDatatable ref="datatable" />
  </ACard>
</template>
