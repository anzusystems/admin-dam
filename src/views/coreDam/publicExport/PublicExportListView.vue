<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { ref } from 'vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'
import PublicExportDatatable from '@/views/coreDam/publicExport/components/PublicExportDatatable.vue'
import PublicExportCreateButton from '@/views/coreDam/publicExport/components/PublicExportCreateButton.vue'
import { usePublicExportListActions } from '@/views/coreDam/publicExport/composables/publicExportActions'

const { listLoading } = usePublicExportListActions()

const datatable = ref<InstanceType<typeof PublicExportDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_PUBLIC_EXPORT_CREATE">
        <PublicExportCreateButton
          data-cy="button-create"
          disable-redirect
          @on-success="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <PublicExportDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
