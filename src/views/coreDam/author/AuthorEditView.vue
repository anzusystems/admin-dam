<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAuthorEditActions } from '@/views/coreDam/author/composables/authorActions'
import AuthorEditForm from '@/views/coreDam/author/components/AuthorEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate, author } =
  useAuthorEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.author.list'), routeName: '/(coreDam)/authors' },
    {
      title: author.value.name || t('breadcrumb.coreDam.author.edit'),
      routeName: '/(coreDam)/authors/[id]/edit',
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
      <AActionCloseButton :route-name="'/(coreDam)/authors'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorEditForm />
    </VCardText>
  </ACard>
</template>
