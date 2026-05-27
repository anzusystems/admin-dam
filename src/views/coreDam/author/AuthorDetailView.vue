<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAuthorDetailActions } from '@/views/coreDam/author/composables/authorActions'
import AuthorDetail from '@/views/coreDam/author/components/AuthorDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, author } = useAuthorDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.author.list'), routeName: '/(coreDam)/authors' },
    {
      title: author.value.name || t('breadcrumb.coreDam.author.detail'),
      routeName: '/(coreDam)/authors/[id]',
    },
  ])
)

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_AUTHOR_UPDATE">
        <AActionEditButton v-if="!detailLoading" :record-id="id" :route-name="'/(coreDam)/authors/[id]/edit'" />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/authors'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorDetail />
    </VCardText>
  </ACard>
</template>
