<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useExtSystemEditActions } from '@/domains/coreDam/extSystem/composables/extSystemActions'
import ExtSystemEditForm from '@/domains/coreDam/extSystem/components/ExtSystemEditForm.vue'
import ExtSystemTtsSettingsForm from '@/domains/coreDam/extSystem/components/ExtSystemTtsSettingsForm.vue'
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
      <AActionCloseButton :route-name="'/(coreDam)/ext-systems'" />
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
