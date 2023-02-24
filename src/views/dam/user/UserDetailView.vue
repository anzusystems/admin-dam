<script lang="ts" setup>
import UserDetail from '@/views/dam/user/components/UserDetail.vue'
import { useUserDetailActions } from '@/views/dam/user/composables/userActions'
import { useRoute } from 'vue-router'
import { stringToInt } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { AActionEditButton } from '@anzusystems/common-admin'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { ACard } from '@anzusystems/common-admin'

const { detailLoading, fetchData, resetStore } = useUserDetailActions()

const route = useRoute()
const id = stringToInt(route.params.id)

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.user.meta.detail')" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_USER_UPDATE">
      <AActionEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.USER.EDIT" />
      <AActionEditButton
        v-if="!detailLoading"
        :record-id="id"
        :route-name="ROUTE.COMMON.ANZU_USER.EDIT"
        button-t="coreDam.user.button.editPermissions"
      />
    </Acl>
    <AActionCloseButton :route-name="ROUTE.DAM.USER.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <UserDetail />
  </ACard>
</template>
