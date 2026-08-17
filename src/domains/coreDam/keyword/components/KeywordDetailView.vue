<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useKeywordDetailActions } from '@/domains/coreDam/keyword/composables/keywordActions'
import KeywordDetail from '@/domains/coreDam/keyword/components/KeywordDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const { detailLoading, fetchData, resetStore, keyword } = useKeywordDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.keyword.list'), routeName: '/(coreDam)/keywords' },
    {
      title: keyword.value.name || t('breadcrumb.coreDam.keyword.detail'),
      routeName: '/(coreDam)/keywords/[id]',
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
      <Acl :permission="ACL.DAM_KEYWORD_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/keywords/[id]/edit'"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/keywords'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <KeywordDetail />
    </VCardText>
  </ACard>
</template>
