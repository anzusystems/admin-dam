<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import {
  AActionCloseButton,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  stringToInt
} from '@anzusystems/common-admin'
import {
  usePublicExportDetailActions,
  usePublicExportRemoveActions,
} from '@/views/coreDam/publicExport/composables/publicExportActions'
import PublicExportDetail from '@/views/coreDam/publicExport/components/PublicExportDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, publicExport } = usePublicExportDetailActions()
const { removePublicExport } = usePublicExportRemoveActions()

const route = useRoute()
const id = stringToInt(route.params.id)

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
  <ActionbarWrapper :last-breadcrumb-title="publicExport.phrase">
    <template #buttons>
      <Acl :permission="ACL.DAM_PUBLIC_EXPORT_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :route-params="{ id: id }"
          :route-name="ROUTE.DAM.PUBLIC_EXPORT.EDIT"
        />
      </Acl>
      <Acl :permission="ACL.DAM_PUBLIC_EXPORT_UPDATE">
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="removePublicExport(id)"
        />
      </Acl>
      <AActionCloseButton
        :route-name="ROUTE.DAM.PUBLIC_EXPORT.LIST"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PublicExportDetail />
    </VCardText>
  </ACard>
</template>
