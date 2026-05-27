<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard, defineBreadcrumbs, stringToInt, useI18n } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserDetail from '@/views/common/anzuUser/components/AnzuUserDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { fetchAnzuUser, resetAnzuUserStore, detailLoading } = useAnzuUserActions(damClient)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.anzuUser.list'), routeName: '/(common)/anzu-user' },
    {
      title: t('breadcrumb.anzuUser.detail'),
      routeName: '/(common)/anzu-user/[id]',
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
          :route-name="'/(common)/anzu-user/[id]/edit'"
          :loading="detailLoading"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(common)/anzu-user'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AnzuUserDetail :client="damClient" />
    </VCardText>
  </ACard>
</template>
