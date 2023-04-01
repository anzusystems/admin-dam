<script lang="ts" setup>
import { AFormTextField, ASystemEntityScope } from '@anzusystems/common-admin'
import { usePermissionGroupValidation } from '@/views/common/permissionGroup/composables/permissionGroupValidations'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import type { AxiosInstance } from 'axios'
import PermissionEditor from '@/views/common/permission/components/PermissionEditor.vue'
import { ENTITY } from '@/services/api/common/permissionGroupApi'

const props = defineProps<{
  client: () => AxiosInstance
}>()
const { permissionGroup, loadingPermissionGroup } = usePermissionGroupActions(props.client)
const { v$ } = usePermissionGroupValidation(permissionGroup)
</script>

<template>
  <ASystemEntityScope
    system="common"
    :subject="ENTITY"
  >
    <VRow>
      <VCol cols="12">
        <VCard
          :loading="loadingPermissionGroup"
          variant="flat"
        >
          <VCardText>
            <AFormTextField
              v-model="permissionGroup.title"
              :v="v$.permissionGroup.title"
              data-cy="permissionGroup-title"
            />
            <AFormTextField
              v-model="permissionGroup.description"
              :v="v$.permissionGroup.description"
              data-cy="permissionGroup-description"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12">
        <PermissionEditor
          v-model="permissionGroup.permissions"
          :client="client"
          is-edit
        />
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
