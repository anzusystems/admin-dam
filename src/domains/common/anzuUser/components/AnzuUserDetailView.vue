<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useI18n,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import AnzuUserDetail from '@/domains/common/anzuUser/components/AnzuUserDetail.vue'
import { useAnzuUserActions } from '@/domains/common/anzuUser/composables/anzuUserActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { fetchAnzuUser, resetAnzuUserStore, detailLoading } = useAnzuUserActions()

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
      <AActionCloseButtonHistory
        :fallback-route-name="'/(common)/anzu-users'"
        :skip-route-names="['/(common)/anzu-users/[id]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AnzuUserDetail :client="damClient" />
    </VCardText>
  </ACard>
</template>
