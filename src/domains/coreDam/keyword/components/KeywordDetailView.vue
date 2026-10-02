<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import KeywordDetail from '@/domains/coreDam/keyword/components/KeywordDetail.vue'
import { useKeywordDetailActions } from '@/domains/coreDam/keyword/composables/keywordActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

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

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/keywords',
  skipRouteNames: ['/(coreDam)/keywords/[id]/edit'],
  loading: detailLoading,
})

onMounted(async () => {
  if ((await fetchData(id, { signal })) === false) await leave()
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
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/keywords'"
        :skip-route-names="['/(coreDam)/keywords/[id]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <KeywordDetail />
    </VCardText>
  </ACard>
</template>
