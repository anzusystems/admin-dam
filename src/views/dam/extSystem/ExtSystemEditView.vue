<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { toInt } from '@/utils/string'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ASaveButton from '@/components/common/buttons/action/ASaveButton.vue'
import ASaveAndCloseButton from '@/components/common/buttons/action/ASaveAndCloseButton.vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useExtSystemEditActions } from '@/views/dam/extSystem/composables/extSystemActions'
import ExtSystemEditForm from '@/views/dam/extSystem/components/ExtSystemEditForm.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { t } = useI18n({ useScope: 'global' })

const route = useRoute()
const id = toInt(route.params.id)

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate } =
  useExtSystemEditActions()

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
  <ActionbarTitleWrapper :heading="t('coreDam.extSystem.meta.edit')" icon="mdi-folder-account-outline" />
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
    <ACloseButton :route-name="ROUTE.DAM.EXT_SYSTEM.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <ExtSystemEditForm />
  </ACard>
</template>
