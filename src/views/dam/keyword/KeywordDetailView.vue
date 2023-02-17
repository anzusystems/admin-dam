<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useKeywordDetailActions } from '@/views/dam/keyword/composables/keywordActions'
import KeywordDetail from '@/views/dam/keyword/components/KeywordDetail.vue'
import { ACard } from '@anzusystems/common-admin'

const { detailLoading, fetchData, resetStore } = useKeywordDetailActions()

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

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.keyword.meta.detail')" icon="mdi-file-key-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_KEYWORD_UPDATE">
      <AEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.KEYWORD.EDIT" />
    </Acl>
    <ACloseButton :route-name="ROUTE.DAM.KEYWORD.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <KeywordDetail />
  </ACard>
</template>
