<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useKeywordDetailActions } from '@/views/coreDam/keyword/composables/keywordActions'
import KeywordDetail from '@/views/coreDam/keyword/components/KeywordDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, keyword } = useKeywordDetailActions()

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
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="keyword.name">
    <template #buttons>
      <Acl :permission="ACL.DAM_KEYWORD_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="ROUTE.DAM.KEYWORD.EDIT"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.KEYWORD.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <KeywordDetail />
    </VCardText>
  </ACard>
</template>
