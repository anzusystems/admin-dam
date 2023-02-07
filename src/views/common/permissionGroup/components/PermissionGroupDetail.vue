<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import ARow from '@/components/common/ARow.vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePermissionGroupOneStore } from '@/stores/common/permissionGroupStore'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import type { AxiosInstance } from 'axios'
import PermissionEditor from '@/views/common/permission/components/PermissionEditor.vue'

defineProps<{
  client: () => AxiosInstance
}>()

const { permissionGroup, loadingPermissionGroup } = storeToRefs(usePermissionGroupOneStore())

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VRow>
    <VCol cols="12" sm="8">
      <VRow>
        <VCol cols="12">
          <ACard :loading="loadingPermissionGroup">
            <VCardText>
              <ARow :title="t('common.permissionGroup.model.title')" :value="permissionGroup.title" />
              <ARow :title="t('common.permissionGroup.model.description')" :value="permissionGroup.description" />
            </VCardText>
          </ACard>
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12">
          <PermissionEditor v-model="permissionGroup.permissions" :client="client" />
        </VCol>
      </VRow>
    </VCol>
    <VCol cols="12" sm="4">
      <ACard loader="detail">
        <ARow :title="t('common.permissionGroup.model.id')">
          <ACopyText :value="permissionGroup.id" />
        </ARow>
        <AUserAndTimeTrackingFields :data="permissionGroup" />
      </ACard>
    </VCol>
  </VRow>
</template>
