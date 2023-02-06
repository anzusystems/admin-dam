<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useAnzuUserOneStore } from '@/stores/common/anzuUserStore'
import { storeToRefs } from 'pinia'
import ACopyText from '@/components/common/ACopyText.vue'
import ABooleanValue from '@/components/common/ABooleanValue.vue'
import PermissionGroupLazyChip from '@/views/common/permissionGroup/components/PermissionGroupLazyChip.vue'
import type { AxiosInstance } from 'axios'
import PermissionEditor from '@/views/common/permission/components/PermissionEditor.vue'
import { usePermissionConfigActions } from '@/views/common/permission/composables/permissionConfigActions'

const props = defineProps<{
  client: () => AxiosInstance
}>()

const { anzuUser, loadingAnzuUser } = storeToRefs(useAnzuUserOneStore())
const { translatePermission } = usePermissionConfigActions(props.client)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VCard :loading="loadingAnzuUser" variant="flat">
    <VCardText>
      <VRow>
        <VCol cols="12" sm="4">
          <h4>{{ t('common.anzuUser.model.id') }}</h4>
          <ACopyText :value="anzuUser.id"></ACopyText>
        </VCol>
        <VCol cols="12" sm="4">
          <h4>{{ t('common.anzuUser.model.email') }}</h4>
          {{ anzuUser.email }}
        </VCol>
        <VCol cols="12" sm="4">
          <h4>{{ t('common.anzuUser.model.enabled') }}</h4>
          <ABooleanValue :value="anzuUser.enabled" chip></ABooleanValue>
        </VCol>
        <VCol cols="12" sm="4">
          <h4>{{ t('common.anzuUser.model.roles') }}</h4>
          <VChip v-for="role in anzuUser.roles" :key="role" class="mr-1 mb-1">{{
            translatePermission('roles', role)
          }}</VChip>
        </VCol>
        <VCol cols="12" sm="8" v-if="anzuUser.permissionGroups.length > 0">
          <h4>{{ t('common.anzuUser.model.permissionGroups') }}</h4>
          <PermissionGroupLazyChip
            v-for="permissionGroupId in anzuUser.permissionGroups"
            :key="permissionGroupId"
            :id="permissionGroupId"
            class="mr-1 mb-1"
          ></PermissionGroupLazyChip>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
  <PermissionEditor
    v-model="anzuUser.permissions"
    :resolved-permissions="anzuUser.resolvedPermissions"
    :roles="anzuUser.roles"
    :client="client"
    class="mt-3"
  ></PermissionEditor>
</template>