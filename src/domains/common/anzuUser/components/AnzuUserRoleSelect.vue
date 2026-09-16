<script lang="ts" setup>
import type { AxiosInstance } from 'axios'
import { usePermissionConfigActions } from '@/domains/common/permission/composables/permissionConfigActions'

const props = defineProps<{
  client: () => AxiosInstance
}>()
const roles = computed({
  get() {
    return modelValue.value
  },
  set(newRoles: string[]) {
    modelValue.value = newRoles
  },
})
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { permissionConfig, translatePermission } = usePermissionConfigActions(props.client)
const items = computed(() =>
  permissionConfig.value.roles.map((role) => {
    return {
      title: translatePermission('roles', role),
      value: role,
    }
  })
)
const modelValue = defineModel<string[]>({ required: true })
const { t } = useI18n()
</script>

<template>
  <VAutocomplete
    v-model="roles"
    :items="items"
    item-value="value"
    item-title="title"
    :label="t('common.anzuUser.model.roles')"
    multiple
    chips
    closable-chips
    clearable
    hide-details
  />
</template>
