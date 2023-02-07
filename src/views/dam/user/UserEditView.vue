<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import UserEditForm from '@/views/dam/user/components/UserEditForm.vue'
import { toInt } from '@/utils/string'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useUserEditActions } from '@/views/dam/user/composables/userActions'
import ASaveButton from '@/components/common/buttons/action/ASaveButton.vue'
import ASaveAndCloseButton from '@/components/common/buttons/action/ASaveAndCloseButton.vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { t } = useI18n({ useScope: 'global' })

const route = useRoute()
const id = toInt(route.params.id)

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
  <ActionbarTitleWrapper :heading="t('coreDam.user.meta.edit')" icon="mdi-account" />
  <ActionbarButtonsWrapper>
    <ASaveButton
      v-if="!detailLoading"
      @save-record="onUpdate"
      :loading="saveButtonLoading"
      :disabled="saveAndCloseButtonLoading"
    />
    <ASaveAndCloseButton
      v-if="!detailLoading"
      @save-record-and-close="onUpdate(true)"
      :loading="saveAndCloseButtonLoading"
      :disabled="saveButtonLoading"
    />
    <ACloseButton :route-name="ROUTE.DAM.USER.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <UserEditForm />
  </ACard>
</template>
