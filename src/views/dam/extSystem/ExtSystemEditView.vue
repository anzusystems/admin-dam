<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { toInt } from '@/utils/string'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { AActionSaveButton } from '@anzusystems/common-admin'
import { AActionSaveAndCloseButton } from '@anzusystems/common-admin'
import { AActionCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useExtSystemEditActions } from '@/views/dam/extSystem/composables/extSystemActions'
import ExtSystemEditForm from '@/views/dam/extSystem/components/ExtSystemEditForm.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { t } = useI18n()

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
    <AActionCloseButton :route-name="ROUTE.DAM.EXT_SYSTEM.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <ExtSystemEditForm />
  </ACard>
</template>
