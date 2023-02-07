<script lang="ts" setup>
import UserDetail from '@/views/dam/user/components/UserDetail.vue'
import { useUserDetailActions } from '@/views/dam/user/composables/userActions'
import { useRoute } from 'vue-router'
import { toInt } from '@/utils/string'
import { onBeforeUnmount, onMounted } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import ACard from '@/components/common/ACard.vue'

const { detailLoading, fetchData, resetStore } = useUserDetailActions()

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
  <ActionbarTitleWrapper :heading="t('coreDam.user.meta.detail')" icon="mdi-account" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_USER_UPDATE">
      <AEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.USER.EDIT" />
    </Acl>
    <ACloseButton :route-name="ROUTE.DAM.USER.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <UserDetail />
  </ACard>
</template>
