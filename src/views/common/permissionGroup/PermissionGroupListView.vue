<script lang="ts" setup>
import { ACL } from '@/types/Permission'
import { ref } from 'vue'
import PermissionGroupDatatable from '@/views/common/permissionGroup/components/PermissionGroupDatatable.vue'
import { damClient } from '@/services/api/clients/damClient'
import PermissionGroupCreateButton from '@/views/common/permissionGroup/components/PermissionGroupCreateButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const datatable = ref<InstanceType<typeof PermissionGroupDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
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

  <PermissionGroupDatatable
    ref="datatable"
    :client="damClient"
  />
</template>
