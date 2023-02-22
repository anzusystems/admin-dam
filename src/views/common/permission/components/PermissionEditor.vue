<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { Permissions } from '@/types/Permission'
import { usePermissionConfigActions } from '@/views/common/permission/composables/permissionConfigActions'
import type { AxiosInstance } from 'axios'
import PermissionGrantEditor from '@/views/common/permission/components/PermissionGrantEditor.vue'
import { isUndefined } from '@/utils/common'
import { computed } from 'vue'
import PermissionValueChip from '@/views/common/permission/components/PermissionValueChip.vue'
import { deletePropertyByPath, getValueByPath, Grant, GrantOrigin, setValueByPath } from '@anzusystems/common-admin'
import { simpleCloneObject } from '@/utils/object'
import { useCurrentUser } from '@/composables/system/currentUser'

const props = defineProps<{
  modelValue: Permissions
  resolvedPermissions?: Permissions
  roles?: string[]
  client: () => AxiosInstance
  isEdit?: boolean
}>()
const permissions = computed(() => simpleCloneObject(props.modelValue))
const emit = defineEmits<{
  (e: 'update:modelValue', data: Permissions): void
}>()
const { permissionConfig, loadingPermissionConfig, isPermissionConfigInitialized, translatePermission } =
  usePermissionConfigActions(props.client)
const changeGrant = (subject: string, action: string, grant?: Grant) => {
  const permissionName = subject + '_' + action
  if (isUndefined(grant) && Object.hasOwn(permissions.value, permissionName)) {
    deletePropertyByPath(permissions.value, permissionName)
    emit('update:modelValue', permissions.value)
    return
  }
  setValueByPath(permissions.value, permissionName, grant)
  emit('update:modelValue', permissions.value)
}
const getSelectedGrant = (subject: string, action: string) => {
  const permissionName = subject + '_' + action
  return getValueByPath(permissions.value, permissionName)
}
const getAvailableGrants = (subject: string, action: string) => {
  const grants = getValueByPath(permissionConfig.value.config, subject + '.' + action + '.grants')
  if (isUndefined(grants)) {
    return permissionConfig.value.defaultGrants
  }
  return grants
}
const { currentUserIsSuperAdmin } = useCurrentUser()
const getResolvedGrant = (subject: string, action: string) => {
  if (currentUserIsSuperAdmin.value) {
    return Grant.Allow
  }
  const permissionName = subject + '_' + action
  if (props.resolvedPermissions) {
    if (Object.hasOwn(props.resolvedPermissions, permissionName)) {
      return getValueByPath(props.resolvedPermissions, permissionName)
    }
  }
  if (Object.hasOwn(permissions.value, permissionName)) {
    return getValueByPath(permissions.value, permissionName)
  }
  return Grant.Deny
}
const getGrantOrigin = (subject: string, action: string) => {
  if (hasSuperAdminRole(props.roles)) {
    return GrantOrigin.Role
  }
  const permissionName = subject + '_' + action
  if (isUndefined(props.resolvedPermissions)) {
    if (Object.hasOwn(permissions.value, permissionName)) {
      return GrantOrigin.Group
    }
  }
  if (props.resolvedPermissions) {
    if (Object.hasOwn(permissions.value, permissionName)) {
      return GrantOrigin.User
    }
    if (Object.hasOwn(props.resolvedPermissions, permissionName)) {
      return GrantOrigin.Group
    }
  }

  return GrantOrigin.DefaultGrant
}
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VCard :loading="loadingPermissionConfig" variant="flat">
    <VCardText>
      <VTable v-if="isPermissionConfigInitialized">
        <thead>
          <tr>
            <th>{{ t('common.anzuUser.table.grants') }}</th>
            <th v-if="isEdit">{{ t('common.anzuUser.table.permissions') }}</th>
            <th>{{ t('common.anzuUser.table.resolvedPermissions') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="permissionSubject in Object.keys(permissionConfig.config)" :key="permissionSubject">
            <tr>
              <td :colspan="isEdit ? 3 : 2" class="text-h6">
                {{ translatePermission('subjects', permissionSubject) }}
              </td>
            </tr>
            <tr
              v-for="permissionAction in Object.keys(permissionConfig.config[permissionSubject])"
              :key="permissionAction"
            >
              <td>
                {{ translatePermission('actions', permissionAction) }}
                <div class="text-caption text-disabled">{{ permissionSubject }}_{{ permissionAction }}</div>
              </td>
              <td v-if="isEdit">
                <PermissionGrantEditor
                  :available-grants="getAvailableGrants(permissionSubject, permissionAction)"
                  :selected-grant="getSelectedGrant(permissionSubject, permissionAction)"
                  @change="changeGrant(permissionSubject, permissionAction, $event)"
                />
              </td>
              <td>
                <PermissionValueChip
                  :grant="getResolvedGrant(permissionSubject, permissionAction)"
                  :grant-origin="getGrantOrigin(permissionSubject, permissionAction)"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </VTable>
    </VCardText>
  </VCard>
</template>
