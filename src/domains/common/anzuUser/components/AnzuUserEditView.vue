<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AnzuUserEditForm from '@/domains/common/anzuUser/components/AnzuUserEditForm.vue'
import { useAnzuUserActions } from '@/domains/common/anzuUser/composables/anzuUserActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { resetAnzuUserStore, fetchAnzuUser, updateAnzuUser, detailLoading, saveButtonLoading } = useAnzuUserActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.anzuUser.list'), routeName: '/(common)/anzu-users' },
    {
      title: t('breadcrumb.anzuUser.edit'),
      routeName: '/(common)/anzu-users/[id]/edit',
    },
  ])
)

const getData = () => {
  fetchAnzuUser(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetAnzuUserStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        :loading="saveButtonLoading"
        @save-record="updateAnzuUser"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(common)/anzu-users'"
        :skip-route-names="['/(common)/anzu-users/[id]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AnzuUserEditForm :client="damClient" />
    </VCardText>
  </ACard>
</template>
