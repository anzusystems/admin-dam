<script lang="ts" setup>
import UserDetail from '@/views/coreDam/user/components/UserDetail.vue'
import { useUserDetailActions } from '@/views/coreDam/user/composables/userActions'
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, user } = useUserDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.user.list'), routeName: '/(coreDam)/users' },
    {
      title: user.value.id + '' || t('breadcrumb.coreDam.user.detail'),
      routeName: '/(coreDam)/users/[id]',
    },
  ])
)

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_USER_UPDATE">
        <AActionEditButton v-if="!detailLoading" :record-id="id" :route-name="'/(coreDam)/users/[id]/edit'" />
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(common)/anzu-users/[id]/edit'"
          variant="secondary"
          button-t="coreDam.user.button.editPermissions"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/users'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <UserDetail />
    </VCardText>
  </ACard>
</template>
