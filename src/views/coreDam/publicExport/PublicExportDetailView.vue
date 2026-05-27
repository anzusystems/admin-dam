<script lang="ts" setup>
import { AActionCloseButton, AActionDeleteButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import {
  usePublicExportDetailActions,
  usePublicExportRemoveActions,
} from '@/views/coreDam/publicExport/composables/publicExportActions'
import PublicExportDetail from '@/views/coreDam/publicExport/components/PublicExportDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, publicExport } = usePublicExportDetailActions()
const { removePublicExport } = usePublicExportRemoveActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.publicExport.list'), routeName: '/(coreDam)/public-exports' },
    {
      title: publicExport.value.slug || t('breadcrumb.coreDam.publicExport.detail'),
      routeName: '/(coreDam)/public-exports/[id]',
    },
  ])
)

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_PUBLIC_EXPORT_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :route-params="{ id: id }"
          :route-name="'/(coreDam)/public-exports/[id]/edit'"
        />
      </Acl>
      <Acl :permission="ACL.DAM_PUBLIC_EXPORT_UPDATE">
        <AActionDeleteButton v-if="!detailLoading" data-cy="button-delete" @delete-record="removePublicExport(id)" />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/public-exports'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PublicExportDetail />
    </VCardText>
  </ACard>
</template>
