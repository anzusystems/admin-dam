<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useI18n,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import ExtSystemEditForm from '@/domains/coreDam/extSystem/components/ExtSystemEditForm.vue'
import ExtSystemTtsSettingsForm from '@/domains/coreDam/extSystem/components/ExtSystemTtsSettingsForm.vue'
import { useExtSystemEditActions } from '@/domains/coreDam/extSystem/composables/extSystemActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate, extSystem } =
  useExtSystemEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.extSystem.list'), routeName: '/(coreDam)/ext-systems' },
    {
      title: extSystem.value.name || t('breadcrumb.coreDam.extSystem.edit'),
      routeName: '/(coreDam)/ext-systems/[id]/edit',
    },
  ])
)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/ext-systems'"
        :skip-route-names="['/(coreDam)/ext-systems/[id]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <ExtSystemEditForm />
    </VCardText>
  </ACard>

  <ACard
    class="mt-4"
    :loading="detailLoading"
    :title="t('coreDam.extSystem.ttsSettings.title')"
  >
    <VCardText>
      <ExtSystemTtsSettingsForm />
    </VCardText>
  </ACard>
</template>
