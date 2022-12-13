<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { toInt } from '@/utils/string'
import { onBeforeUnmount, onMounted } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { usePermissionGroupDetailActions } from '@/views/dam/permissionGroup/composables/permissionGroupActions'
import PermissionGroupDetail from '@/views/dam/permissionGroup/components/PermissionGroupDetail.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { loaded, fetchData, resetStore } = usePermissionGroupDetailActions()

const route = useRoute()
const id = toInt(route.params.id)

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.permissionGroup.meta.detail')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_PERMISSION_GROUP_UPDATE">
      <AEditButton v-if="loaded" :record-id="id" :route-name="ROUTE.DAM.PERMISSION_GROUP.EDIT"></AEditButton>
    </Acl>
    <ACloseButton :route-name="ROUTE.DAM.PERMISSION_GROUP.LIST"></ACloseButton>
  </ActionbarButtonsWrapper>
  <PermissionGroupDetail></PermissionGroupDetail>
</template>
