<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'
import { useAnzuUserActions } from '@/domains/common/anzuUser/composables/anzuUserActions'
import AnzuUserDetail from '@/domains/common/anzuUser/components/AnzuUserDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { fetchAnzuUser, resetAnzuUserStore, detailLoading } = useAnzuUserActions(damClient)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.anzuUser.list'), routeName: '/(common)/anzu-users' },
    {
      title: t('breadcrumb.anzuUser.detail'),
      routeName: '/(common)/anzu-users/[id]',
    },
  ])
)

const getDetail = () => {
  fetchAnzuUser(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetAnzuUserStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl
        v-if="!detailLoading"
        :permission="ACL.DAM_USER_UPDATE"
      >
        <AActionEditButton
          :record-id="id"
          :route-name="'/(common)/anzu-users/[id]/edit'"
          :loading="detailLoading"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(common)/anzu-users'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AnzuUserDetail :client="damClient" />
    </VCardText>
  </ACard>
</template>
