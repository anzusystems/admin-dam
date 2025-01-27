<script lang="ts" setup>
import type { Permissions } from '@/types/Permission'
import PermissionGrantEditor from '@/views/common/permission/components/PermissionGrantEditor.vue'
import PermissionValueChip from '@/views/common/permission/components/PermissionValueChip.vue'
import { usePermissionConfigActions } from '@/views/common/permission/composables/permissionConfigActions'
import type { GrantType } from '@anzusystems/common-admin'
import {
  cloneDeep,
  Grant,
  GrantOrigin,
  GrantOriginDefault,
  isUndefined,
  objectDeletePropertyByPath,
  objectGetValueByPath,
  objectSetValueByPath,
  ROLE_SUPER_ADMIN,
} from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: Permissions
  resolvedPermissions?: Permissions
  roles?: string[]
  client: () => AxiosInstance
  isEdit?: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', data: Permissions): void
}>()
const permissions = computed(() => cloneDeep(props.modelValue))
const { permissionConfig, loadingPermissionConfig, isPermissionConfigInitialized, translatePermission } =
  // eslint-disable-next-line vue/no-setup-props-reactivity-loss
  usePermissionConfigActions(props.client)
const changeGrant = (subject: string, action: string, grant?: GrantType) => {
  const permissionName = subject + '_' + action
  if (isUndefined(grant) && Object.hasOwn(permissions.value, permissionName)) {
    objectDeletePropertyByPath(permissions.value, permissionName)
    emit('update:modelValue', permissions.value)
    return
  }
  objectSetValueByPath(permissions.value, permissionName, grant)
  emit('update:modelValue', permissions.value)
}
const getSelectedGrant = (subject: string, action: string) => {
  const permissionName = subject + '_' + action
  return objectGetValueByPath(permissions.value, permissionName)
}
const getAvailableGrants = (subject: string, action: string) => {
  const grants = objectGetValueByPath(permissionConfig.value.config, subject + '.' + action + '.grants')
  if (isUndefined(grants)) {
    return permissionConfig.value.defaultGrants
  }
  return grants
}
const hasSuperAdminRole = computed(() => props.roles?.includes(ROLE_SUPER_ADMIN) ?? false)
const getResolvedGrant = (subject: string, action: string) => {
  if (hasSuperAdminRole.value) {
    return Grant.Allow
  }
  const permissionName = subject + '_' + action
  if (props.resolvedPermissions) {
    if (Object.hasOwn(props.resolvedPermissions, permissionName)) {
      return objectGetValueByPath(props.resolvedPermissions, permissionName)
    }
  }
  if (Object.hasOwn(permissions.value, permissionName)) {
    return objectGetValueByPath(permissions.value, permissionName)
  }
  return Grant.Deny
}
const getGrantOrigin = (subject: string, action: string) => {
  if (hasSuperAdminRole.value) {
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

  return GrantOriginDefault
}
const { t } = useI18n()
</script>

<template>
  <VCard
    :loading="loadingPermissionConfig"
    variant="flat"
  >
    <VCardText>
      <VTable v-if="isPermissionConfigInitialized">
        <thead>
          <tr>
            <th>{{ t('common.anzuUser.table.grants') }}</th>
            <th v-if="isEdit">
              {{ t('common.anzuUser.table.permissions') }}
            </th>
            <th>{{ t('common.anzuUser.table.resolvedPermissions') }}</th>
          </tr>
        </thead>
        <tbody>
          <template
            v-for="permissionSubject in Object.keys(permissionConfig.config)"
            :key="permissionSubject"
          >
            <tr>
              <td
                :colspan="isEdit ? 3 : 2"
                class="text-h6"
              >
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
