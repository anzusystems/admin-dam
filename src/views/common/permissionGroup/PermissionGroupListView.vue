<script lang="ts" setup>
import { ACL } from '@/types/Permission'
import { ref } from 'vue'
import PermissionGroupDatatable from '@/views/common/permissionGroup/components/PermissionGroupDatatable.vue'
import PermissionGroupCreateButton from '@/views/common/permissionGroup/components/PermissionGroupCreateButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import { damClient } from '@/services/api/clients/damClient'
import { ACard } from '@anzusystems/common-admin'

const datatable = ref<InstanceType<typeof PermissionGroupDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { listLoading } = usePermissionGroupActions(damClient)
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_PERMISSION_GROUP_CREATE">
        <PermissionGroupCreateButton
          data-cy="button-create"
          disable-redirect
          :client="damClient"
          @after-create="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <PermissionGroupDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
