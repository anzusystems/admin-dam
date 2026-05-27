<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { usePublicExportEditActions } from '@/views/coreDam/publicExport/composables/publicExportActions'
import PublicExportEditForm from '@/views/coreDam/publicExport/components/PublicExportEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { detailLoading, fetchData, resetStore, onUpdate, saveButtonLoading, saveAndCloseButtonLoading, publicExport } =
  usePublicExportEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.publicExport.list'), routeName: '/(coreDam)/public-export' },
    {
      title: publicExport.value.slug || t('breadcrumb.coreDam.publicExport.edit'),
      routeName: '/(coreDam)/public-export/[id]/edit',
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
      <AActionCloseButton :route-name="'/(coreDam)/public-export/[id]'" :route-params="{ id: id }" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PublicExportEditForm />
    </VCardText>
  </ACard>
</template>
