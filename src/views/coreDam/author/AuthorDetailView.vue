<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import { useAuthorDetailActions } from '@/views/coreDam/author/composables/authorActions'
import AuthorDetail from '@/views/coreDam/author/components/AuthorDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, author } = useAuthorDetailActions()

const route = useRoute()
const id = route.params.id.toString()

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="author.name">
    <template #buttons>
      <Acl :permission="ACL.DAM_AUTHOR_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="ROUTE.DAM.AUTHOR.EDIT"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.AUTHOR.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorDetail />
    </VCardText>
  </ACard>
</template>
