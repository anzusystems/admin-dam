<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ASaveButton from '@/components/common/buttons/action/ASaveButton.vue'
import ASaveAndCloseButton from '@/components/common/buttons/action/ASaveAndCloseButton.vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { damClient } from '@/services/api/clients/damClient'
import { toInt } from '@anzusystems/common-admin'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserEditForm from '@/views/common/anzuUser/components/AnzuUserEditForm.vue'

const { t } = useI18n({ useScope: 'global' })

const route = useRoute()
const id = toInt(route.params.id)

const { resetAnzuUserStore, fetchAnzuUser, updateAnzuUser, loadingAnzuUser } = useAnzuUserActions(damClient)

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
  <ActionbarTitleWrapper :heading="t('common.anzuUser.meta.edit')" icon="mdi-account-edit-outline" />
  <ActionbarButtonsWrapper>
    <ASaveButton @save-record="updateAnzuUser" :loading="loadingAnzuUser"></ASaveButton>
    <ASaveAndCloseButton @save-record-and-close="updateAnzuUser(true)" :loading="loadingAnzuUser"></ASaveAndCloseButton>
    <ACloseButton :route-name="ROUTE.COMMON.ANZU_USER.LIST"></ACloseButton>
  </ActionbarButtonsWrapper>
  <AnzuUserEditForm :client="damClient" />
</template>
