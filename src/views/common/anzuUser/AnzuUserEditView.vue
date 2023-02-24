<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  AActionCloseButton,
  AActionSaveAndCloseButton,
  AActionSaveButton,
  stringToInt
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { damClient } from '@/services/api/clients/damClient'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserEditForm from '@/views/common/anzuUser/components/AnzuUserEditForm.vue'

const { t } = useI18n()

const route = useRoute()
const id = stringToInt(route.params.id)

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
  <ActionbarTitleWrapper :heading="t('common.anzuUser.meta.edit')" />
  <ActionbarButtonsWrapper>
    <AActionSaveButton :loading="loadingAnzuUser" @save-record="updateAnzuUser" />
    <AActionSaveAndCloseButton :loading="loadingAnzuUser" @save-record-and-close="updateAnzuUser(true)" />
    <AActionCloseButton :route-name="ROUTE.COMMON.ANZU_USER.LIST" />
  </ActionbarButtonsWrapper>
  <AnzuUserEditForm :client="damClient" />
</template>
