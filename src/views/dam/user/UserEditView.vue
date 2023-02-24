<script lang="ts" setup>
import {
  AActionCloseButton,
  AActionSaveAndCloseButton,
  AActionSaveButton,
  ACard,
  stringToInt
} from '@anzusystems/common-admin'
import UserEditForm from '@/views/dam/user/components/UserEditForm.vue'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useUserEditActions } from '@/views/dam/user/composables/userActions'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { t } = useI18n()

const route = useRoute()
const id = stringToInt(route.params.id)

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate } =
  useUserEditActions()

const getData = () => {
  fetchData(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.user.meta.edit')" />
  <ActionbarButtonsWrapper>
    <AActionSaveButton
      v-if="!detailLoading"
      :loading="saveButtonLoading"
      :disabled="saveAndCloseButtonLoading"
      @save-record="onUpdate"
    />
    <AActionSaveAndCloseButton
      v-if="!detailLoading"
      :loading="saveAndCloseButtonLoading"
      :disabled="saveButtonLoading"
      @save-record-and-close="onUpdate(true)"
    />
    <AActionCloseButton :route-name="ROUTE.DAM.USER.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <UserEditForm />
  </ACard>
</template>
