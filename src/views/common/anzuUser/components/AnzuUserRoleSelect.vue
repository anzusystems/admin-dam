<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import type { AxiosInstance } from 'axios'
import { usePermissionConfigActions } from '@/views/common/permission/composables/permissionConfigActions'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string[]
  client: () => AxiosInstance
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', data: string[]): void
}>()
const roles = computed({
  get() {
    return props.modelValue
  },
  set(newRoles: string[]) {
    emit('update:modelValue', newRoles)
  },
})
const { permissionConfig, translatePermission } = usePermissionConfigActions(props.client)
const items = computed(() =>
  permissionConfig.value.roles.map((role) => {
    return {
      title: translatePermission('roles', role),
      value: role,
    }
  })
)
const { t } = useI18n({ useScope: 'global' })
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
